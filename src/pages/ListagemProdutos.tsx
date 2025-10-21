import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ShoppingCart, Trash2, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { parsePercentageToDecimal, parseCurrencyToDecimal, formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Produto {
  id: string;
  nome: string;
  codigo?: string;
  unidadeMedida: string;
  custoProducao: number;
  precoVenda: number;
  custoIndireto?: string;
  tipo?: string;
  canaisVenda?: Array<{
    tipo: "balcao" | "plataforma";
    plataformaId?: string;
    plataformaNome?: string;
    valorFinal?: string;
  }>;
}

const ListagemProdutos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const dadosProdutos = localStorage.getItem("produtos");
    if (dadosProdutos) {
      setProdutos(JSON.parse(dadosProdutos));
    }
  }, []);

  const handleBack = () => {
    navigate("/cadastros");
  };

  const handleNovoProduto = () => {
    navigate("/cadastro-produto");
  };

  const handleEditProduto = (id: string) => {
    navigate(`/cadastro-produto/${id}`);
  };

  const handleDeleteProduto = (id: string) => {
    const updatedProdutos = produtos.filter(p => p.id !== id);
    setProdutos(updatedProdutos);
    localStorage.setItem("produtos", JSON.stringify(updatedProdutos));
    
    toast({
      title: "Produto removido!",
      description: "O produto foi excluído com sucesso"
    });
  };

  const filteredProdutos = produtos.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      p.nome.toLowerCase().includes(term) ||
      (p.codigo ? p.codigo.toLowerCase().includes(term) : false)
    );
  });

  const getPrecoBalcao = (produto: Produto): number => {
    // Buscar o valor final do balcão nos canais de venda
    const canalBalcao = produto.canaisVenda?.find(canal => 
      canal.tipo === "balcao" || canal.plataformaNome?.toLowerCase() === "balcão"
    );
    
    if (canalBalcao?.valorFinal) {
      return parseCurrencyToDecimal(canalBalcao.valorFinal);
    }
    
    // Fallback para preço de venda padrão
    return produto.precoVenda || 0;
  };

  const calcularRentabilidade = (produto: Produto) => {
    const custo = produto.custoProducao || 0;
    const preco = getPrecoBalcao(produto);
    if (custo <= 0 || preco <= 0) return { percent: 0, formatted: "0,00%" };
  
    // Busca custo indireto salvo no produto ou no padrão
    const saved = localStorage.getItem("margem");
    let custoIndiretoPercent = 0;
    try {
      if (produto.custoIndireto) {
        custoIndiretoPercent = parsePercentageToDecimal(produto.custoIndireto);
      } else if (saved) {
        const parsed = JSON.parse(saved);
        custoIndiretoPercent = parsePercentageToDecimal(parsed?.custoIndireto || "0");
      }
    } catch {
      custoIndiretoPercent = 0;
    }
  
    // Aplica custo indireto
    const custoComIndireto = custo * (1 + custoIndiretoPercent / 100);
  
    // Calcula rentabilidade
    const percent = ((preco - custoComIndireto) / preco) * 100;
    const formatted = `${percent.toFixed(2).replace('.', ',')}%`;
    return { percent, formatted };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <ArrowLeft className="h-8 w-8 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-primary">
            Produtos
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNovoProduto}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <Plus className="h-8 w-8 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 pb-6 safe-area-bottom">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/cadastros">Cadastros</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Produtos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Busca rápida */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="w-full h-11 sm:h-12 pl-10 pr-3 border border-border rounded-sm text-sm text-foreground"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {filteredProdutos.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
                {produtos.length === 0 && (
                  <Button onClick={handleNovoProduto} className="mt-4">
                    Cadastrar Primeiro Produto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Cabeçalho da tabela - mobile friendly */}
              <div className="hidden sm:grid sm:grid-cols-[80px_1fr_100px_140px_120px_100px] gap-2 px-4 py-2 bg-muted/50 rounded-lg font-bold text-sm border">
                <div>Código</div>
                <div>Produto</div>
                <div>Tipo</div>
                <div>Preço Balcão</div>
                <div>Rentabilidade</div>
                <div></div>
              </div>

              {/* Linhas - responsivas */}
              {filteredProdutos.map((produto) => {
                const rentabilidade = calcularRentabilidade(produto);
                const precoBalcao = getPrecoBalcao(produto);
                return (
                  <div 
                    key={produto.id} 
                    className="border rounded-lg p-3 sm:p-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Layout Mobile */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-foreground">{produto.codigo || "-"}</div>
                          <div className="text-sm text-foreground mt-1">{produto.nome}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduto(produto.id)}
                            className="h-12 w-12 text-muted-foreground hover:text-foreground p-2"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduto(produto.id)}
                            className="h-12 w-12 text-destructive hover:text-destructive/80 p-2"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Tipo: </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            produto.tipo === 'intermediario' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {produto.tipo === 'intermediario' ? 'Intermediário' : 'Final'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Preço: </span>
                          <span className="font-medium">{formatCurrency(precoBalcao)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rentab.: </span>
                          <span className="font-medium">{rentabilidade.formatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Layout Desktop */}
                    <div className="hidden sm:grid sm:grid-cols-[80px_1fr_100px_140px_120px_100px] gap-2 items-center">
                      <div className="font-medium text-foreground">{produto.codigo || "-"}</div>
                      <div className="text-foreground">{produto.nome}</div>
                      <div className="text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          produto.tipo === 'intermediario' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {produto.tipo === 'intermediario' ? 'Intermediário' : 'Final'}
                        </span>
                      </div>
                      <div className="font-medium">{formatCurrency(precoBalcao)}</div>
                      <div className="font-medium">{rentabilidade.formatted}</div>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduto(produto.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduto(produto.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListagemProdutos;