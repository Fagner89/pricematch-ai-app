import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";

interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const CadastroLoja = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
    cnpj: "",
    nomeContato: ""
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Carrega dados salvos ao abrir a tela
  useEffect(() => {
    const carregarDados = async () => {
      const saved = await storage.getItem("dadosLoja");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData((prev) => ({ ...prev, ...parsed }));
        } catch {}
      }

      // Se vier algo via navigate state (ex.: clique em editar), mescla os campos básicos
      const stateLoja: any = (location as any).state?.loja;
      if (stateLoja) {
        setFormData((prev) => ({
          ...prev,
          nome: stateLoja.nome || prev.nome,
          cep: stateLoja.cep || prev.cep,
          endereco: stateLoja.endereco || prev.endereco,
          bairro: stateLoja.bairro || prev.bairro,
          cidade: stateLoja.cidade || prev.cidade,
          estado: stateLoja.uf || prev.estado,
        }));
      }
    };

    carregarDados();
  }, [location]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Remove error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    handleInputChange("cep", formatted);
  };

  const consultarCEP = async () => {
    const cepNumbers = formData.cep.replace(/\D/g, "");
    
    if (cepNumbers.length !== 8) {
      toast({
        title: "CEP Inválido",
        description: "Digite um CEP válido com 8 dígitos",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data: AddressData = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente",
          variant: "destructive"
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || ""
      }));

      toast({
        title: "CEP encontrado!",
        description: "Endereço preenchido automaticamente"
      });
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Não foi possível consultar o CEP. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome da loja é obrigatório";
    }

    if (!formData.nomeContato.trim()) {
      newErrors.nomeContato = "Nome do contato é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Salvar com storage persistente
    await storage.setItem("dadosLoja", JSON.stringify(formData));
    
    toast({
      title: "Loja cadastrada!",
      description: "Os dados da loja foram salvos com sucesso"
    });

    navigate("/listagem-lojas");
  };

  const handleBack = () => {
    navigate("/listagem-lojas");
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
            Lojas
          </h1>
          
          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 safe-area-bottom">
        <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          
          {/* Dados Principais */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                <span>Dados da Loja</span>
                <span className="text-red-500">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Digite o nome da sua loja"
                  className={`w-full h-11 sm:h-12 px-3 py-2 border rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.nome ? 'border-red-500' : 'border-input bg-background'
                  }`}
                />
                {errors.nome && (
                  <p className="text-red-500 text-xs">{errors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  CEP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="flex-1 h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <Button
                    onClick={consultarCEP}
                    disabled={isLoadingCep || formData.cep.length < 9}
                    className="px-4 sm:px-6 h-11 sm:h-12 text-sm"
                  >
                    {isLoadingCep ? "..." : "OK"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    placeholder="Rua, Avenida..."
                    className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                    placeholder="123"
                    className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange("complemento", e.target.value)}
                  placeholder="Apartamento, sala, etc."
                  className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                    placeholder="Bairro"
                    className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange("cidade", e.target.value)}
                    placeholder="Cidade"
                    className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange("estado", e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground">
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nomeContato}
                  onChange={(e) => handleInputChange("nomeContato", e.target.value)}
                  placeholder="Nome do responsável"
                  className={`w-full h-11 sm:h-12 px-3 py-2 border rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.nomeContato ? 'border-red-500' : 'border-input bg-background'
                  }`}
                />
                {errors.nomeContato && (
                  <p className="text-red-500 text-xs">{errors.nomeContato}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contato@loja.com"
                  className="w-full h-11 sm:h-12 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-precifica-gray-text focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
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
            Salvar
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CadastroLoja;