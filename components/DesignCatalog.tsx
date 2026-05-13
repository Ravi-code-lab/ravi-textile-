
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Design, InventoryItem, RecipeItem, DesignLaborCost } from '../types';
import { 
  Search, Plus, Palette, Edit2, Trash2, Package, Calculator, 
  BadgeCheck, Camera, X, FlaskRound, Scissors, PenTool, 
  Sparkles, Droplets, Wind, Box, Ruler, Hash, Percent, 
  ChevronRight, Info, Layers, Maximize2, Tag, FileText, Download,
  ImagePlus, Settings
} from 'lucide-react';
import BaseModal from './BaseModal';
import { commitImage } from '../utils/imageUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DesignCatalogProps {
  designs: Design[];
  inventory: InventoryItem[];
  onAdd: (design: Design) => void;
  onUpdate: (design: Design) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

const DesignCatalog: React.FC<DesignCatalogProps> = ({ 
  designs, inventory, onAdd, onUpdate, onDelete, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<Partial<Design>>({
    status: 'ACTIVE', category: 'KURTI', imageUrl: '', recipe: [],
    processCostPerPiece: 0, targetMargin: 20,
    hasVariants: false, options: [], variants: [],
    description: '', sku: '', finishedGsm: '180', composition: '',
    laborCosts: { cutting: 0, stitching: 0, embroidery: 0, washing: 0, finishing: 0, packing: 0 },
    processLossPercent: 2, hsnCode: '', shrinkage: '2-4%', finishedWidth: '44',
    tags: []
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const [newRecipeItem, setNewRecipeItem] = useState<Partial<RecipeItem>>({ materialName: '', quantity: 0, wastagePercent: 0 });

  const addRecipeItem = () => {
    if (!newRecipeItem.materialName || !newRecipeItem.quantity) return;
    
    const item: RecipeItem = {
      materialName: newRecipeItem.materialName,
      quantity: newRecipeItem.quantity,
      unit: newRecipeItem.unit || 'PCS',
      estimatedCost: (newRecipeItem as any).unitCost || 0,
      wastagePercent: newRecipeItem.wastagePercent || 0
    };

    setFormData(prev => ({
      ...prev,
      recipe: [...(prev.recipe || []), item]
    }));

    setNewRecipeItem({ materialName: '', quantity: 0, wastagePercent: 0 });
  };

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    designs.forEach(d => (d.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [designs]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredDesigns = useMemo(() => {
    return designs.filter(d => {
      const name = d.name || '';
      const sku = d.sku || '';
      const matchesSearch = name.toLowerCase().includes(filter.toLowerCase()) || sku.toLowerCase().includes(filter.toLowerCase());
      const matchesTab = activeTab === 'ALL' || d.status === activeTab;
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => (d.tags || []).includes(t));
      return matchesSearch && matchesTab && matchesTags;
    });
  }, [designs, filter, activeTab, selectedTags]);

  const downloadCatalogPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- Header Configuration ---
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCT CATALOG", 15, 28);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`SYSTEM GEN: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 20, { align: 'right' });
    doc.text("INDUSTRIAL DESIGN REPOSITORY • CORE V8", pageWidth - 15, 26, { align: 'right' });
    doc.text(`FILTERED NODES: ${filteredDesigns.length}`, pageWidth - 15, 32, { align: 'right' });

    // --- Data Matrix Construction ---
    const tableData = filteredDesigns.map(d => {
      const wsp = Math.round((d.processCostPerPiece || 0) * (1 + (d.targetMargin || 0)/100));
      return [
        "", // Column 0: Visual Node (Image)
        `PRODUCT: ${d.name.toUpperCase()}\nSKU CODE: ${d.sku || 'N/A'}\nCATEGORY: ${d.category}\nCOMPO: ${d.composition || 'STANDARD'}\nTAGS: ${(d.tags || []).join(', ') || '-'}`,
        `LANDED COST\n${currency}${Math.round(d.processCostPerPiece || 0).toLocaleString()}\n\nTARGET WSP\n${currency}${wsp.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['VISUAL', 'TECHNICAL SPECIFICATIONS', 'FINANCIAL DATA']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229], // Indigo 600
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      styles: { 
        fontSize: 7.5, 
        cellPadding: 5,
        textColor: [30, 41, 59], // Slate 800
        valign: 'middle',
        overflow: 'linebreak',
        minCellHeight: 42 // Explicit height for image consistency
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },
        // Fix: Removed 'lineHeight' property from the style object as it is not a valid property of jspdf-autotable Styles
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 45, fontStyle: 'bold', halign: 'right' }
      },
      didDrawCell: (data) => {
        // Precise Image Placement logic
        if (data.section === 'body' && data.column.index === 0) {
          const design = filteredDesigns[data.row.index];
          if (design && design.imageUrl) {
            try {
              // Draw a soft frame around the image area
              doc.setDrawColor(241, 245, 249);
              doc.rect(data.cell.x + 4, data.cell.y + 4, 27, 34);
              
              // Add the image centered in the frame
              doc.addImage(
                design.imageUrl, 
                'JPEG', 
                data.cell.x + 5, 
                data.cell.y + 5, 
                25, 
                32,
                undefined,
                'FAST'
              );
            } catch (e) {
              doc.setFontSize(6);
              doc.setTextColor(203, 213, 225);
              doc.text("ERR: VIZ_FAULT", data.cell.x + 17.5, data.cell.y + 21, { align: 'center' });
            }
          } else {
            // Placeholder icon or text
            doc.setFontSize(6);
            doc.setTextColor(203, 213, 225);
            doc.text("NO VISUAL", data.cell.x + 17.5, data.cell.y + 21, { align: 'center' });
          }
        }
      },
      // Styling and paging
      rowPageBreak: 'avoid',
      margin: { left: 15, right: 15, bottom: 20 }
    });

    // --- Dynamic Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`PAGE ${i} OF ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text("CONFIDENTIAL INDUSTRIAL PROTOCOL - RAVI TEXTILE CORE", 15, pageHeight - 10);
        doc.text("VERIFIED VIA NEXUS V8", pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Nexus_Catalog_Export_${new Date().getTime()}.pdf`);
  };

  const calculatedCosting = useMemo(() => {
    const materialCost = (formData.recipe || []).reduce((acc, item) => {
        const material = inventory.find(i => i.name === item.materialName);
        const rate = material?.pricePerUnit || item.estimatedCost || 0;
        const wastageFactor = 1 + (item.wastagePercent || 0) / 100;
        return acc + (item.quantity * rate * wastageFactor);
    }, 0);

    const labor = formData.laborCosts || {};
    const totalProcesses = Object.values(labor).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const subTotal = materialCost + totalProcesses;
    const processLossAmount = subTotal * ((formData.processLossPercent || 0) / 100);
    const totalLanded = subTotal + processLossAmount;

    return { materialCost, totalProcesses, totalLanded, processLossAmount };
  }, [formData.recipe, formData.laborCosts, formData.processLossPercent, inventory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const resultUrl = await commitImage(file);
        setFormData(prev => ({ ...prev, imageUrl: resultUrl }));
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const design = { 
      ...formData, 
      processCostPerPiece: calculatedCosting.totalLanded,
      id: editingId || `DES-${Date.now().toString().slice(-4)}`, 
      updatedAt: new Date().toISOString() 
    } as Design;
    if (editingId) onUpdate(design); else onAdd(design);
    setIsModalOpen(false);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
        e.preventDefault();
        const newTag = tagInput.trim().toUpperCase();
        if (!formData.tags?.includes(newTag)) {
            setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
        }
        setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }));
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-2 h-full flex flex-col bg-[#f8fafc] dark:bg-slate-950 -m-8 p-2 font-sans"
    >
      {/* Header Matrix */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center gap-1.5 glass p-1.5 rounded-xl border border-macos-border dark:border-macos-darkBorder shadow-macos dark:shadow-macos-dark shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-macos-accent rounded-lg text-white shadow-lg shadow-macos-accent/20">
             <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Product Catalog</h2>
            <p className="text-xs font-medium text-slate-500">Design repository and costing engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input className="macos-input w-full pl-7 py-1.5 text-sm" placeholder="Search products..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadCatalogPDF}
            className="px-3 py-1.5 border border-macos-border dark:border-macos-darkBorder rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-macos-accent" /> PDF
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingId(null);
              setFormData({ 
                status: 'ACTIVE', category: 'KURTI', recipe: [],
                targetMargin: 20,
                laborCosts: { cutting: 0, stitching: 0, embroidery: 0, washing: 0, finishing: 0, packing: 0 },
                processLossPercent: 2, hsnCode: '', shrinkage: '2-4%', finishedWidth: '44', finishedGsm: '180',
                tags: []
              });
              setIsModalOpen(true);
            }} 
            className="macos-btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs"
          >
             <Plus className="w-3.5 h-3.5" /> Add Product
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass border border-macos-border dark:border-macos-darkBorder rounded-xl overflow-hidden shadow-macos dark:shadow-macos-dark flex-1 flex flex-col">
          {/* Tabs */}
          <div className="px-2 border-b border-macos-border dark:border-macos-darkBorder bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED'].map(t => (
                      <button 
                        key={t} 
                        onClick={() => setActiveTab(t)} 
                        className={`py-3 px-2 text-xs font-bold border-b-2 transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === t ? 'border-macos-accent text-macos-accent' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                      >
                        {t}
                      </button>
                  ))}
              </div>
              
              {/* Tag Selection Matrix */}
              {allAvailableTags.length > 0 && (
                <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t border-macos-border dark:border-macos-darkBorder">
                    <Tag className="w-3 h-3 text-macos-accent opacity-50 shrink-0" />
                    <div className="flex gap-1.5">
                        {allAvailableTags.map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => toggleTagFilter(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedTags.includes(tag) ? 'bg-macos-accent text-white border-macos-accent shadow-lg shadow-macos-accent/20' : 'bg-white/50 dark:bg-slate-800/50 text-slate-400 border-macos-border dark:border-macos-darkBorder hover:border-macos-accent/50'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    {selectedTags.length > 0 && (
                        <button onClick={() => setSelectedTags([])} className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline ml-2">Clear</button>
                    )}
                </div>
              )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-2">
              <motion.div 
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-2"
              >
                  <AnimatePresence mode="popLayout">
                    {filteredDesigns.map(design => (
                        <motion.div 
                            layout
                            key={design.id} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -4 }}
                            onClick={() => { setEditingId(design.id); setFormData(design); setIsModalOpen(true); }}
                            className="macos-card p-3 flex flex-col h-full cursor-default overflow-hidden group"
                        >
                            {/* Image Container */}
                            <div 
                              className="aspect-[3/4] w-full bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-2 relative border border-macos-border dark:border-macos-darkBorder shadow-inner shrink-0 group/img"
                              onClick={(e) => {
                                  if (design.imageUrl) {
                                      e.stopPropagation();
                                      setPreviewImageUrl(design.imageUrl);
                                  }
                              }}
                            >
                                {design.imageUrl ? (
                                    <>
                                      <img src={design.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <div className="bg-white/90 p-1 rounded-full shadow-xl transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
                                              <Maximize2 className="w-3.5 h-3.5 text-macos-accent" />
                                          </div>
                                      </div>
                                    </>
                                ) : (
                                    <Palette className="w-6 h-6 text-slate-200" />
                                )}
                                <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest shadow-sm ${design.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                    {design.status}
                                </span>
                            </div>
                            
                            {/* Text Content */}
                            <div className="flex-1 flex flex-col">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate mb-0.5 tracking-tight">{design.name}</h3>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-mono text-macos-accent font-bold"># {design.sku || 'N/A'}</span>
                                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">{design.category}</span>
                              </div>

                              {/* BOM Summary - More compact */}
                              {design.recipe && design.recipe.length > 0 && (
                                <div className="mb-2 space-y-0.5">
                                  {design.recipe.slice(0, 1).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[10px] text-slate-500 font-medium">
                                      <span className="truncate max-w-[80px]">{item.materialName}</span>
                                      <span>{item.quantity} {item.unit}</span>
                                    </div>
                                  ))}
                                  {design.recipe.length > 1 && (
                                    <p className="text-[9px] text-macos-accent font-bold uppercase tracking-widest">+{design.recipe.length - 1} MORE</p>
                                  )}
                                </div>
                              )}

                              {/* Tags Shards */}
                              {design.tags && design.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                      {design.tags.slice(0, 3).map(tag => (
                                          <span key={tag} className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest border border-macos-border dark:border-macos-darkBorder">{tag}</span>
                                      ))}
                                      {design.tags.length > 3 && <span className="text-xs text-slate-400 font-bold">+{design.tags.length - 3}</span>}
                                  </div>
                              )}

                              {/* Aligned Footer Section */}
                              <div className="mt-auto pt-3 border-t border-macos-border dark:border-macos-darkBorder">
                                  <div className="flex justify-between items-end">
                                      <div className="flex flex-col">
                                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Landed Cost</span>
                                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{currency}{design.processCostPerPiece?.toLocaleString()}</p>
                                      </div>
                                      <div className="flex flex-col items-end">
                                          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1 leading-none">WSP Target</span>
                                          <p className="text-sm font-black text-emerald-600 tabular-nums">{currency}{Math.round((design.processCostPerPiece || 0) * (1 + (design.targetMargin || 0)/100)).toLocaleString()}</p>
                                      </div>
                                  </div>
                              </div>
                            </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
              </motion.div>
          </div>
      </motion.div>

      {/* Large Image Preview Modal */}
      <BaseModal 
        isOpen={!!previewImageUrl} 
        onClose={() => setPreviewImageUrl(null)} 
        title="Product Preview" 
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col items-center justify-center p-8">
            <div className="glass p-2 rounded-2xl border border-macos-border dark:border-macos-darkBorder shadow-macos dark:shadow-macos-dark overflow-hidden">
                {previewImageUrl && (
                    <motion.img 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={previewImageUrl} 
                        className="max-w-full max-h-[70vh] object-contain rounded-xl" 
                        alt="Preview"
                    />
                )}
            </div>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewImageUrl(null)}
                className="mt-8 px-10 py-3 macos-btn-primary"
            >
                Close Preview
            </motion.button>
        </div>
      </BaseModal>

      <BaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Product' : 'New Product'}
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            {/* Basic Info Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input className="macos-input w-full py-2 text-sm" placeholder="e.g., Summer Floral Kurti" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">SKU / Code</label>
                      <input className="macos-input w-full font-mono py-2 text-sm" placeholder="SKU-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">HSN Code</label>
                      <input className="macos-input w-full font-mono py-2 text-sm" placeholder="6204" value={formData.hsnCode} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="macos-input w-full py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                      {['KURTI', 'PANT', 'DUPATTA', 'SET', 'FABRIC', 'ACCESSORY'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select className="macos-input w-full py-2 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                      {['ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Target Margin (%)</label>
                    <input type="number" className="macos-input w-full py-2 text-sm" value={formData.targetMargin} onChange={e => setFormData({...formData, targetMargin: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                  <div className="flex gap-2">
                    <input className="macos-input flex-1 py-2 text-sm" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    <div className="relative">
                        <button className="p-2 border border-macos-border dark:border-macos-darkBorder rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <ImagePlus className="w-4 h-4 text-macos-accent" />
                        </button>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Preview Area */}
              <div className="border border-dashed border-macos-border dark:border-macos-darkBorder rounded-xl flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden group relative">
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold uppercase tracking-widest">Preview</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <Palette className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications Matrix */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-macos-accent" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Technical Specs</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Shrinkage</label>
                  <input className="macos-input w-full py-2 text-sm" placeholder="e.g., 2-4%" value={formData.shrinkage} onChange={e => setFormData({...formData, shrinkage: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Finished Width</label>
                  <input className="macos-input w-full py-2 text-sm" placeholder='e.g., 44"' value={formData.finishedWidth} onChange={e => setFormData({...formData, finishedWidth: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Finished GSM</label>
                  <input className="macos-input w-full py-2 text-sm" placeholder="e.g., 180" value={formData.finishedGsm} onChange={e => setFormData({...formData, finishedGsm: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Process Loss (%)</label>
                  <input type="number" className="macos-input w-full py-2 text-sm" value={formData.processLossPercent} onChange={e => setFormData({...formData, processLossPercent: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            {/* BOM Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <FlaskRound className="w-4 h-4 text-macos-accent" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Bill of Materials (BOM)</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Items: {formData.recipe?.length || 0}</span>
              </div>
              
              <div className="glass border border-macos-border dark:border-macos-darkBorder rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-macos-border dark:border-macos-darkBorder">
                      <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Material</th>
                      <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                      <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Wastage %</th>
                      <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Cost</th>
                      <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-macos-border dark:divide-macos-darkBorder">
                    {formData.recipe?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300">{item.materialName}</td>
                        <td className="px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">{item.quantity} {item.unit}</td>
                        <td className="px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">{item.wastagePercent}%</td>
                        <td className="px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">{currency}{item.estimatedCost || 0}</td>
                        <td className="px-3 py-2 text-sm font-bold text-macos-accent">{currency}{(item.quantity * (item.estimatedCost || 0) * (1 + (item.wastagePercent || 0)/100)).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => setFormData(prev => ({ ...prev, recipe: prev.recipe?.filter((_, i) => i !== idx) }))} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Add New Item Row */}
                    <tr className="bg-macos-accent/5 dark:bg-macos-accent/10">
                      <td className="px-3 py-2">
                        <select className="macos-input w-full py-1 text-sm" value={newRecipeItem.materialName} onChange={e => {
                          const item = inventory.find(i => i.name === e.target.value);
                          if (item) setNewRecipeItem({...newRecipeItem, materialName: item.name, unit: item.unit, unitCost: item.pricePerUnit} as any);
                        }}>
                          <option value="">Select Material</option>
                          {inventory.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="macos-input w-full py-1 text-sm" placeholder="Qty" value={newRecipeItem.quantity || ''} onChange={e => setNewRecipeItem({...newRecipeItem, quantity: Number(e.target.value)})} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="macos-input w-full py-1 text-sm" placeholder="Wastage %" value={newRecipeItem.wastagePercent || ''} onChange={e => setNewRecipeItem({...newRecipeItem, wastagePercent: Number(e.target.value)})} />
                      </td>
                      <td className="px-3 py-2" colSpan={2}>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Cost: {currency}{(newRecipeItem as any).unitCost || 0} / {newRecipeItem.unit || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={addRecipeItem} className="p-1.5 bg-macos-accent text-white rounded-lg shadow-lg shadow-macos-accent/20 hover:scale-105 transition-transform active:scale-95">
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Labor Costs Matrix */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 text-macos-accent" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Labor Costs</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                    { key: 'cutting', label: 'CUTTING', icon: Scissors },
                    { key: 'stitching', label: 'STITCHING', icon: PenTool },
                    { key: 'embroidery', label: 'EMBROIDERY', icon: Sparkles },
                    { key: 'washing', label: 'WASHING', icon: Droplets },
                    { key: 'finishing', label: 'FINISH', icon: Wind },
                    { key: 'packing', label: 'PACKING', icon: Box }
                ].map(proc => (
                  <div key={proc.key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 truncate block">{proc.label}</label>
                    <input 
                      type="number" 
                      className="macos-input w-full py-1.5 text-sm" 
                      value={(formData.laborCosts as any)?.[proc.key] || ''} 
                      onChange={e => setFormData({
                        ...formData, 
                        laborCosts: { ...formData.laborCosts, [proc.key]: Number(e.target.value) } as DesignLaborCost
                      })} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Matrix */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-macos-accent" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Product Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2 p-3 glass border border-macos-border dark:border-macos-darkBorder rounded-xl">
                {allAvailableTags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => {
                      const tags = formData.tags || [];
                      const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
                      setFormData({...formData, tags: newTags});
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${formData.tags?.includes(tag) ? 'bg-macos-accent text-white border-macos-accent shadow-lg shadow-macos-accent/20' : 'bg-white/50 dark:bg-slate-800/50 text-slate-400 border-macos-border dark:border-macos-darkBorder hover:border-macos-accent/50'}`}
                  >
                    {tag}
                  </button>
                ))}
                <div className="flex gap-2 ml-auto">
                  <input 
                    className="macos-input text-xs w-32 py-1" 
                    placeholder="New Tag..." 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Matrix */}
          <div className="p-4 border-t border-macos-border dark:border-macos-darkBorder bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md flex justify-between items-center shrink-0">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total BOM</span>
                <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{currency}{calculatedCosting.materialCost.toLocaleString()}</p>
              </div>
              <div className="flex flex-col border-l border-macos-border dark:border-macos-darkBorder pl-4">
                <span className="text-xs font-bold text-macos-accent uppercase tracking-widest mb-0.5">Landed Cost</span>
                <p className="text-base font-black text-macos-accent tabular-nums">{currency}{calculatedCosting.totalLanded.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {editingId && (
                  <button onClick={() => { if(confirm('Permanently delete this design?')) onDelete(editingId); setIsModalOpen(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">Delete</button>
              )}
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} className="macos-btn-primary px-6 py-1.5 text-xs">
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      </BaseModal>
    </motion.div>
  );
};

export default DesignCatalog;
