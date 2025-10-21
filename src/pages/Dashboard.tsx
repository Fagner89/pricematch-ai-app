import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Plus, Package, ShoppingCart, TrendingUp, TrendingDown, Menu, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { storage, vendasDiarias } from "@/lib/storage";

const Dashboard = () => {
  const navigate = useNavigate();
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [vendasHoje, setVendasHoje] = useState({ total: 0, quantidade: 0 });
  const [produtosRentabilidade, setProdutosRentabilidade] = useState<{
    maiores: Array<{ nome: string; rentabilidade: number }>;
    menores: Array<{ nome: string; rentabilidade: number }>;
  }>({ maiores: [], menores: [] });

  useEffect(() => {
    const carregarDados = async () => {
      const dadosLoja = await storage.getItem("dadosLoja");
      if (dadosLoja) {
        const loja = JSON.parse(dadosLoja);
        if (loja.nomeContato) {
          const primeiroNome = loja.nomeContato.split(' ')[0];
          setNomeEmpresa(primeiroNome);
        }
      }

      // Carregar vendas de hoje usando novo sistema
      const vendas = await vendasDiarias.obterVendasHoje();
      setVendasHoje(vendas);

      // Calcular rentabilidade dos produtos
      await calcularRentabilidade();
    };

    carregarDados();
  }, []);

  const calcularRentabilidade = async () => {
    const pedidos = JSON.parse(await storage.getItem("pedidos") || "[]");
    const produtos = JSON.parse(await storage.getItem("produtos") || "[]");
    const insumos = JSON.parse(await storage.getItem("insumos") || "[]");
    const hoje = new Date().toDateString();

    // Filtrar pedidos de hoje
    const pedidosHoje = pedidos.filter((p: any) => {
      const dataPedido = new Date(p.data).toDateString();
      return dataPedido === hoje;
    });

    if (pedidosHoje.length === 0) {
      setProdutosRentabilidade({ maiores: [], menores: [] });
      return;
    }

    // Calcular rentabilidade por produto
    const rentabilidadePorProduto: { [key: string]: { nome: string; rentabilidade: number; vendas: number } } = {};

    pedidosHoje.forEach((pedido: any) => {
      pedido.itens.forEach((item: any) => {
        const produto = produtos.find((p: any) => p.id === item.produtoId);
        if (!produto) return;

        // Calcular custo do produto usando custoProducao
        const custoProduto = produto.custoProducao || 0;

        console.info('Cálculo Rentabilidade Dashboard:', {
          produto: produto.nome,
          custoProduto,
          precoUnitario: item.precoUnitario,
          quantidade: item.quantidade
        });

        // Calcular rentabilidade: (preço - custo) / preço * 100
        const rentabilidade = item.precoUnitario > 0 
          ? ((item.precoUnitario - custoProduto) / item.precoUnitario) * 100 
          : 0;

        if (!rentabilidadePorProduto[produto.id]) {
          rentabilidadePorProduto[produto.id] = {
            nome: produto.nome,
            rentabilidade: rentabilidade,
            vendas: item.quantidade
          };
        } else {
          // Média ponderada pela quantidade vendida
          const totalVendas = rentabilidadePorProduto[produto.id].vendas + item.quantidade;
          rentabilidadePorProduto[produto.id].rentabilidade = 
            ((rentabilidadePorProduto[produto.id].rentabilidade * rentabilidadePorProduto[produto.id].vendas) + 
            (rentabilidade * item.quantidade)) / totalVendas;
          rentabilidadePorProduto[produto.id].vendas = totalVendas;
        }
      });
    });

    const produtosOrdenados = Object.values(rentabilidadePorProduto).sort((a, b) => b.rentabilidade - a.rentabilidade);

    setProdutosRentabilidade({
      maiores: produtosOrdenados.slice(0, 3),
      menores: produtosOrdenados.slice(-3).reverse()
    });
  };

  const handleUserClick = async () => {
    const dadosLoja = await storage.getItem("dadosLoja");
    if (dadosLoja) {
      // Se já tem loja cadastrada, vai para listagem
      navigate("/listagem-lojas");
    } else {
      // Se não tem loja, vai para cadastro
      navigate("/cadastro-loja");
    }
  };

  // Get today's date in Brazilian format
  const today = new Date().toLocaleDateString("pt-BR");

  const [counts, setCounts] = useState({ produtos: 0, insumos: 0, entradas: 0, vendas: 0 });

  useEffect(() => {
    const getCounts = async () => {
      const produtos = JSON.parse(await storage.getItem("produtos") || "[]");
      const insumos = JSON.parse(await storage.getItem("insumos") || "[]");
      
      setCounts({
        produtos: produtos.length,
        insumos: insumos.length,
        entradas: 0, // Not implemented yet
        vendas: 0 // Not implemented yet
      });
    };

    getCounts();
  }, []);

  const actionButtons = [
    {
      title: "Calculadora de Preço",
      icon: Calculator,
      path: "/calculadora-preco",
      count: 0,
      label: "Ferramenta",
      active: true,
      countNavigateTo: null,
      isPrimary: true
    },
    {
      title: "Novo Produto",
      icon: Package,
      path: "/cadastro-produto",
      count: counts.produtos,
      label: "Produtos cadastrados",
      active: true,
      countNavigateTo: "/listagem-produtos"
    },
    {
      title: "Novo Insumo",
      icon: Package,
      path: "/cadastro-insumo", 
      count: counts.insumos,
      label: "Insumos cadastrados",
      active: true,
      countNavigateTo: "/listagem-insumos"
    },
    {
      title: "Novo Pedido",
      icon: ShoppingCart,
      path: "/pedidos/novo",
      count: vendasHoje.quantidade,
      label: "Pedidos hoje",
      active: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cadastros")}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <Menu className="h-8 w-8 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-foreground">
            Olá, {nomeEmpresa}
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUserClick}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <User className="h-8 w-8 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 pb-6 safe-area-bottom">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Sales Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Today's Sales */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Vendas Hoje</h3>
                  <p className="text-xs text-muted-foreground">{today}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(vendasHoje.total)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Orders Count */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Quantidade</h3>
                  <p className="text-xs text-muted-foreground">de Pedidos</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{vendasHoje.quantidade}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profitability Section */}
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Higher Profitability */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-sm text-foreground">Maior Rentabilidade</h4>
                  </div>
                  <div className="space-y-2">
                    {produtosRentabilidade.maiores.length > 0 ? (
                      produtosRentabilidade.maiores.map((produto, idx) => (
                        <div key={idx} className="text-xs text-foreground p-2 bg-muted rounded">
                          {produto.nome} ({produto.rentabilidade.toFixed(1)}%)
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Lower Profitability */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <h4 className="font-semibold text-sm text-foreground">Menor Rentabilidade</h4>
                  </div>
                  <div className="space-y-2">
                    {produtosRentabilidade.menores.length > 0 ? (
                      produtosRentabilidade.menores.map((produto, idx) => (
                        <div key={idx} className="text-xs text-foreground p-2 bg-muted rounded">
                          {produto.nome} ({produto.rentabilidade.toFixed(1)}%)
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">-</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {actionButtons.map((button, index) => {
              const IconComponent = button.icon;
              const isPrimary = (button as any).isPrimary;
              
              return (
                <Card 
                  key={index} 
                  className={`shadow-sm transition-all duration-200 ${
                    button.active 
                      ? 'hover:shadow-md cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  } ${isPrimary ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10' : ''}`}
                  onClick={() => button.active && navigate(button.path)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon with Plus */}
                        <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                          button.active ? (isPrimary ? 'bg-primary shadow-lg' : 'bg-primary') : 'bg-muted'
                        }`}>
                          <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${
                            button.active ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`} />
                          {!isPrimary && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                              <Plus className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm sm:text-base ${
                            button.active ? (isPrimary ? 'text-primary' : 'text-foreground') : 'text-muted-foreground'
                          }`}>
                            {button.title}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Count (only number clickable) - hide for calculator */}
                      {!isPrimary && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((button as any).countNavigateTo) {
                                navigate((button as any).countNavigateTo);
                              }
                            }}
                            className="group text-right focus:outline-none"
                            aria-label={`Abrir listagem de ${button.label}`}
                          >
                            <p className="text-lg sm:text-xl font-bold text-foreground group-hover:underline underline-offset-4">
                              {button.count.toString().padStart(4, '0')}
                            </p>
                            <p className="text-xs text-muted-foreground">{button.label}</p>
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Cadastros Button */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate("/cadastros")}>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <h3 className="font-semibold text-base text-primary">Acessar Cadastros</h3>
                <p className="text-sm text-muted-foreground mt-1">Configure sua loja e produtos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;