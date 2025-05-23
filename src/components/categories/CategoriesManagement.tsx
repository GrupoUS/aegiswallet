
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag, Edit, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  is_predefined: boolean;
}

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          is_predefined: false,
        });

      if (error) {
        toast({
          title: "Erro ao criar categoria",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Categoria criada!",
          description: "A categoria foi adicionada com sucesso",
        });
        setNewCategoryName("");
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editingCategory.name.trim() })
        .eq("id", editingCategory.id);

      if (error) {
        toast({
          title: "Erro ao atualizar categoria",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Categoria atualizada!",
          description: "A categoria foi atualizada com sucesso",
        });
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        toast({
          title: "Erro ao excluir categoria",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Categoria excluída!",
          description: "A categoria foi removida com sucesso",
        });
        fetchCategories();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Carregando categorias...</div>;
  }

  const predefinedCategories = categories.filter(c => c.is_predefined);
  const customCategories = categories.filter(c => !c.is_predefined);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Categorias</h2>
      </div>

      {/* Adicionar Nova Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newCategory">Nome da Categoria</Label>
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Pets, Viagem, etc."
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addCategory} disabled={!newCategoryName.trim()}>
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorias Predefinidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorias Predefinidas ({predefinedCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {predefinedCategories.map((category) => (
              <div
                key={category.id}
                className="p-3 bg-gray-100 rounded-lg text-center font-medium text-gray-700"
              >
                {category.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorias Personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Suas Categorias ({customCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Você ainda não criou categorias personalizadas
            </div>
          ) : (
            <div className="space-y-3">
              {customCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  {editingCategory?.id === category.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, name: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button size="sm" onClick={updateCategory}>
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{category.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEditingCategory({ id: category.id, name: category.name })
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesManagement;
