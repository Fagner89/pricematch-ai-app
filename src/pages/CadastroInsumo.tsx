import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseBRLToCents, formatCentsToBRL, decimalToCents } from "@/lib/monetary";
import { storage } from "@/lib/storage";

interface Insumo {
  id: string;
  nome: string;
  codigo?: string;
  unidade: string;
  preco_cents: number; // Store as cents for consistency
  quantidadeEmbalagem?: number;
  preco_unitario_cents?: number; // Novo campo para o preço unitário calculado
}

const CadastroInsumo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    unidade: "",
    preco: "",
    quantidadeEmbalagem: "",
    precoUnitarioDisplay: ""
  });

  const [internalCents, setInternalCents] = useState(0);
  const [internalQtdEmbalagem, setInternalQtdEmbalagem] = useState<number | undefined>(undefined);
  const [internalPrecoUnitarioCents, setInternalPrecoUnitarioCents] = useState<number | undefined>(undefined);

  const [unidadesMedida, setUnidadesMedida] = useState<string[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load unidades from storage
  useEffect(() => {
    const carregarUnidades = async () => {
      const storedUnidades = JSON.parse(await storage.getItem("unidades") || "[]");
      const unidadeOptions = storedUnidades.map((unidade: any) => unidade.sigla);

      setUnidadesMedida(unidadeOptions);
    };

    carregarUnidades();
  }, []);

  // Load existing data for editing
  useEffect(() => {
    const carregarInsumo = async () => {
      if (editId) {
        const existingInsumos = JSON.parse(await storage.getItem("insumos") || "[]");
        const insumoToEdit = existingInsumos.find((insumo: any) => insumo.id === editId);
        
        if (insumoToEdit) {
          // Handle both old format (preco as decimal) and new format (preco_cents)
          const cents = insumoToEdit.preco_cents !== undefined
            ? Number(insumoToEdit.preco_cents)
            : decimalToCents(insumoToEdit.preco || 0);
          
          setFormData({
            nome: insumoToEdit.nome,
            codigo: insumoToEdit.codigo || "",
            unidade: insumoToEdit.unidade,
            preco: formatCentsToBRL(cents),
            quantidadeEmbalagem: insumoToEdit.quantidadeEmbalagem ? String(insumoToEdit.quantidadeEmbalagem) : "",
            precoUnitarioDisplay: "" // Calculated below
          });
          setInternalCents(cents);
          setInternalQtdEmbalagem(insumoToEdit.quantidadeEmbalagem || undefined);

          if (insumoToEdit.preco_unitario_cents !== undefined) {
            // Se já tem preço unitário salvo, usar ele
            setInternalPrecoUnitarioCents(insumoToEdit.preco_unitario_cents);
            setFormData(prev => ({ ...prev, precoUnitarioDisplay: formatCentsToBRL(insumoToEdit.preco_unitario_cents) }));
          } else if (cents && insumoToEdit.quantidadeEmbalagem) {
            // Senão, calcular baseado no preço e quantidade da embalagem
            const unitPriceCents = Math.round(cents / insumoToEdit.quantidadeEmbalagem);
            setInternalPrecoUnitarioCents(unitPriceCents);
            setFormData(prev => ({ ...prev, precoUnitarioDisplay: formatCentsToBRL(unitPriceCents) }));
          }
        }
      }
    };

    carregarInsumo();
  }, [editId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Remove error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePrecoChange = (value: string) => {
    // Update display value
    setFormData(prev => ({ ...prev, preco: value }));
    // Update internal cents value
    const cents = parseBRLToCents(value);
    setInternalCents(cents);
    // Recalculate unit price
    calculatePrecoUnitario(cents, internalQtdEmbalagem);
    // Remove error when user starts typing
    if (errors.preco) {
      setErrors(prev => ({ ...prev, preco: "" }));
    }
  };

  const handleQuantidadeEmbalagemChange = (value: string) => {
    // Allow empty string for display, but parse to number for calculation
    setFormData(prev => ({ ...prev, quantidadeEmbalagem: value }));
    const parsedValue = value === "" ? undefined : Number(value.replace(",", "."));
    setInternalQtdEmbalagem(parsedValue);
    // Recalculate unit price
    calculatePrecoUnitario(internalCents, parsedValue);
    if (errors.quantidadeEmbalagem) {
      setErrors(prev => ({ ...prev, quantidadeEmbalagem: "" }));
    }
  };

  const calculatePrecoUnitario = (precoCents: number, quantidadeEmbalagem?: number) => {
    if (precoCents && quantidadeEmbalagem && quantidadeEmbalagem > 0) {
      const unitPriceCents = Math.round(precoCents / quantidadeEmbalagem);
      setInternalPrecoUnitarioCents(unitPriceCents);
      setFormData(prev => ({ ...prev, precoUnitarioDisplay: formatCentsToBRL(unitPriceCents) }));
    } else {
      setInternalPrecoUnitarioCents(undefined);
      setFormData(prev => ({ ...prev, precoUnitarioDisplay: "" }));
    }
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};

    if (unidadesMedida.length === 0) {
      toast({
        title: "Nenhuma unidade cadastrada",
        description: "É necessário cadastrar pelo menos uma unidade de medida antes de cadastrar insumos.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!formData.unidade) {
      newErrors.unidade = "Unidade de Medida é obrigatória";
    }

    if (!formData.preco.trim()) {
      newErrors.preco = "Preço é obrigatório";
    }

    // Check for duplicates (skip if editing)
    const existingInsumos = JSON.parse(await storage.getItem("insumos") || "[]");
    const nomeLower = formData.nome.trim().toLowerCase();
    const codigoTrimmed = formData.codigo.trim();
    
    const duplicateNome = existingInsumos.find((i: Insumo) => 
      i.nome.toLowerCase() === nomeLower && (!editId || i.id !== editId)
    );
    
    if (duplicateNome) {
      newErrors.nome = "Já existe um insumo com este nome";
    }

    if (codigoTrimmed) {
      const duplicateCodigo = existingInsumos.find((i: Insumo) => 
        i.codigo && i.codigo.toLowerCase() === codigoTrimmed.toLowerCase() && (!editId || i.id !== editId)
      );
      
      if (duplicateCodigo) {
        newErrors.codigo = "Já existe um insumo com este código";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveInsumo = async () => {
    if (!await validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Os campos Nome, Unidade de Medida e Preço são obrigatórios",
        variant: "destructive"
      });
      return false;
    }

    const existingInsumos = JSON.parse(await storage.getItem("insumos") || "[]");
    
    if (editId) {
      // Update existing insumo
      const updatedInsumos = existingInsumos.map((insumo: any) => 
        insumo.id === editId 
          ? {
              ...insumo,
              nome: formData.nome.trim(),
              codigo: formData.codigo.trim(),
              unidade: formData.unidade,
              preco_cents: internalCents,
              quantidadeEmbalagem: internalQtdEmbalagem,
              preco_unitario_cents: internalPrecoUnitarioCents // Salva o preço unitário calculado
            }
          : insumo
      );
      await storage.setItem("insumos", JSON.stringify(updatedInsumos));
    } else {
      // Create new insumo
      const newInsumo = {
        id: Date.now().toString(),
        nome: formData.nome.trim(),
        codigo: formData.codigo.trim(),
        unidade: formData.unidade,
        preco_cents: internalCents,
        quantidadeEmbalagem: internalQtdEmbalagem,
        preco_unitario_cents: internalPrecoUnitarioCents // Salva o preço unitário calculado
      };
      existingInsumos.push(newInsumo);
      await storage.setItem("insumos", JSON.stringify(existingInsumos));
    }

    return true;
  };

  const handleSave = async () => {
    if (await saveInsumo()) {
      toast({
        title: editId ? "Insumo atualizado!" : "Insumo salvo!",
        description: editId ? "O insumo foi atualizado com sucesso" : "O insumo foi cadastrado com sucesso"
      });
      navigate("/listagem-insumos");
    }
  };

  const handleContinuarCadastrando = async () => {
    if (editId) {
      // If editing, just save and go back to list
      handleSave();
      return;
    }
    
    if (await saveInsumo()) {
      toast({
        title: "Insumo salvo!",
        description: "Continue cadastrando mais insumos"
      });
      
      // Clear form
      setFormData({
        nome: "",
        codigo: "",
        unidade: "",
        preco: "",
        quantidadeEmbalagem: "",
        precoUnitarioDisplay: ""
      });
      setInternalCents(0);
      setInternalQtdEmbalagem(undefined);
      setInternalPrecoUnitarioCents(undefined);
      setErrors({});
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    navigate("/listagem-insumos");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-primary">
            {editId ? "Editar Insumo" : "Insumos"}
          </h1>
          
          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 safe-area-bottom">
        <div className="max-w-lg mx-auto p-4">
          
          <Card className="shadow-lg border-0" style={{ borderRadius: '3px' }}>
            <CardContent className="p-6">
              
              <div className="space-y-4">
                {/* Nome Field */}
                <div>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Nome"
                    className={`w-full h-12 px-4 border rounded text-sm ${
                      errors.nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.nome && (
                    <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                  )}
                </div>

                {/* Código Field */}
                <div>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange("codigo", e.target.value)}
                    placeholder="Código"
                    className={`w-full h-12 px-4 border rounded text-sm ${
                      errors.codigo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.codigo && (
                    <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>
                  )}
                </div>

                {/* Unidade de Medida Field */}
                <div>
                  <select
                    value={formData.unidade}
                    onChange={(e) => handleInputChange("unidade", e.target.value)}
                    className={`w-full h-12 px-4 border rounded text-sm ${
                      errors.unidade ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ borderRadius: '3px', color: formData.unidade ? '#000' : '#666666' }}
                    disabled={unidadesMedida.length === 0}
                  >
                    <option value="">
                      {unidadesMedida.length === 0
                        ? "Nenhuma unidade cadastrada"
                        : "Unidade Medida"}
                    </option>
                    {unidadesMedida.map(unidade => (
                      <option key={unidade} value={unidade}>{unidade}</option>
                    ))}
                  </select>
                  {errors.unidade && (
                    <p className="text-red-500 text-xs mt-1">{errors.unidade}</p>
                  )}
                  {unidadesMedida.length === 0 && (
                    <p className="text-yellow-600 text-xs mt-1">
                      Cadastre uma unidade de medida antes de cadastrar insumos.
                    </p>
                  )}
                </div>

                {/* Preço Field */}
                <div>
                  <input
                    type="text"
                    value={formData.preco}
                    onChange={(e) => handlePrecoChange(e.target.value)}
                    placeholder="Preço"
                    className={`w-full h-12 px-4 border rounded text-sm ${
                      errors.preco ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.preco && (
                    <p className="text-red-500 text-xs mt-1">{errors.preco}</p>
                  )}
                </div>

                {/* Quantidade na Embalagem Field */}
                <div>
                  <input
                    type="text"
                    value={formData.quantidadeEmbalagem}
                    onChange={(e) => handleQuantidadeEmbalagemChange(e.target.value)}
                    placeholder="Qtd. na Embalagem"
                    className={`w-full h-12 px-4 border rounded text-sm ${
                      errors.quantidadeEmbalagem ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.quantidadeEmbalagem && (
                    <p className="text-red-500 text-xs mt-1">{errors.quantidadeEmbalagem}</p>
                  )}
                </div>

                {/* Preço Unitário Display */}
                <div>
                  <input
                    type="text"
                    value={formData.precoUnitarioDisplay}
                    placeholder="Preço Unitário"
                    className="w-full h-12 px-4 border border-gray-300 rounded text-sm"
                    style={{ borderRadius: '3px', color: '#666666' }}
                    disabled
                  />
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-16">
                <Button
                  onClick={handleContinuarCadastrando}
                  className="w-full h-12 font-bold"
                  style={{ backgroundColor: '#180F33', borderRadius: '3px' }}
                >
                  {editId ? "Salvar Alterações" : "Salvar e Continuar Cadastrando"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Buttons */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-11 sm:h-12 text-sm"
          >
            Voltar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-11 sm:h-12 text-sm font-semibold"
          >
            {editId ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CadastroInsumo;