import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Edit3, PlusCircle, FileCheck, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

export default function PageListScreen({
  pages,
  onReorderPages,
  onAddAnotherPage,
  onAddPage,
  onEditPage,
  onDeletePage,
  onCreatePdf,
  onGeneratePdf,
  isGeneratingPdf,
}) {
  const [deletingIndex, setDeletingIndex] = useState(null);

  const handleAdd = onAddAnotherPage || onAddPage;
  const handlePdf = onCreatePdf || onGeneratePdf;

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorderPages(items);
  };

  const movePage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    const items = Array.from(pages);
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    onReorderPages(items);
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-xl mx-auto w-full space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-white">
            Document Pages ({pages.length})
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Hold handle to drag or use arrows to change page order
          </p>
        </div>
        
        {/* Add Another Page Header Button */}
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold text-xs hover:bg-blue-600/30 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4 text-blue-400" />
          <span>Add Page</span>
        </button>
      </div>

      {/* Pages List with Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="document-pages">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3 flex-1"
            >
              {pages.map((page, index) => (
                <Draggable key={page.id} draggableId={page.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-slate-800 border rounded-2xl p-3 flex items-center gap-3 transition-all ${
                        snapshot.isDragging
                          ? 'border-blue-500 bg-slate-750 shadow-2xl scale-[1.02] z-50 ring-2 ring-blue-500/40'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="p-2 text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-700/50"
                        title="Hold & Drag to reorder"
                      >
                        <GripVertical className="w-6 h-6" />
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative w-16 h-20 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex-shrink-0 shadow-inner group">
                        <img
                          src={page.croppedImage || page.rawImageSrc}
                          alt={`Page ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white font-bold text-[10px] text-center py-0.5">
                          P.{index + 1}
                        </span>
                      </div>

                      {/* Page Info & Title */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-white text-base truncate">
                          PAGE {index + 1}
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {index === 0 ? 'First Page (Front)' : `Page #${index + 1}`}
                        </p>

                        {/* Quick Order Up/Down Touch Buttons */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            onClick={() => movePage(index, index - 1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => movePage(index, index + 1)}
                            disabled={index === pages.length - 1}
                            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons: Edit / Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPage(index)}
                          className="p-2.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-blue-400 active:scale-95 transition-all"
                          title="Re-crop page"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => setDeletingIndex(index)}
                          className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 hover:bg-red-900/60 text-red-400 active:scale-95 transition-all"
                          title="Delete page"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Action Buttons Area */}
      <div className="space-y-3 pt-2">
        {/* Add Another Page Button */}
        <button
          onClick={handleAdd}
          className="btn-secondary-xl py-4 border-dashed border-2 border-slate-600 hover:border-slate-500 bg-slate-800/60 text-slate-200"
        >
          <PlusCircle className="w-6 h-6 text-blue-400" />
          <span>➕ Add Another Page</span>
        </button>

        {/* Create PDF Primary Button */}
        <button
          onClick={handlePdf}
          disabled={isGeneratingPdf}
          className="btn-primary-xl py-5 text-xl shadow-blue-600/30 active:scale-95 disabled:opacity-50"
        >
          <FileCheck className="w-7 h-7 text-white" />
          <span>{isGeneratingPdf ? 'Creating PDF...' : `📄 Create PDF (${pages.length} Pages)`}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="font-heading text-xl font-bold text-white">
              Delete Page {deletingIndex + 1}?
            </h3>

            <p className="text-sm text-slate-300">
              Are you sure you want to remove this page from the document?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingIndex(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePage(deletingIndex);
                  setDeletingIndex(null);
                }}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white text-sm active:scale-95 shadow-lg shadow-red-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
