'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Lock, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SerializedCategory {
  _id: string;
  name: string;
  isDefault: boolean;
}

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<SerializedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newNameError, setNewNameError] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingError, setEditingError] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<SerializedCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => {
          setCategories(d.categories || []);
          setLoading(false);
        });
    }
  }, [open]);

  async function handleAddCategory() {
    if (!newName.trim()) {
      setNewNameError('Category name is required.');
      return;
    }
    setAddingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.status === 409) {
        setNewNameError('A category with that name already exists.');
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories((prev) => [...prev, data.category]);
      setNewName('');
      setNewNameError('');
      toast.success('Category added');
    } catch {
      toast.error('Failed to update category. Try again.');
    } finally {
      setAddingCategory(false);
    }
  }

  function handleStartEdit(category: SerializedCategory) {
    setEditingId(category._id);
    setEditingName(category.name);
    setEditingError('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingName('');
    setEditingError('');
  }

  async function handleSaveRename() {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.status === 409) {
        setEditingError('A category with that name already exists.');
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories((prev) =>
        prev.map((cat) => (cat._id === editingId ? data.category : cat))
      );
      setEditingId(null);
      setEditingName('');
      setEditingError('');
      toast.success('Category renamed');
    } catch {
      toast.error('Failed to update category. Try again.');
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((cat) => cat._id !== deletingCategory._id));
      setDeletingCategory(null);
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to update category. Try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Add, rename, or delete your expense categories.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {categories.map((category) => (
                <div key={category._id}>
                  <div className="flex items-center gap-2 border-b border-gray-100 py-2 hover:bg-gray-50 px-2 rounded">
                    {editingId === category._id ? (
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Save rename"
                            onClick={handleSaveRename}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Cancel rename"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {editingError && (
                          <p className="text-xs text-red-600">{editingError}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-900">{category.name}</span>
                        {category.isDefault ? (
                          <Lock
                            className="h-4 w-4 text-gray-300 flex-shrink-0"
                            title="Default categories cannot be deleted"
                          />
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Rename category"
                              onClick={() => handleStartEdit(category)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete category"
                              onClick={() => setDeletingCategory(category)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New category name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (newNameError) setNewNameError('');
                }}
                maxLength={100}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={addingCategory}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-10 flex-shrink-0"
              >
                {addingCategory ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </Button>
            </div>
            {newNameError && (
              <p className="text-xs text-red-600">{newNameError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Expenses already using this category will keep their existing category label.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
