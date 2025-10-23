import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Package, Ruler, Plus, ShoppingCart, Users, BarChart, Beaker, Percent, PackageOpen, LogOut } from "lucide-react";
import { getStoredCount } from "@/lib/utils";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const Cadastros = () => {
  const navigate = useNavigate();

  const cadastroOptions = [
    /*{
      title: "Estoque",
      description: "Gerencie o estoque",
      icon: PackageOpen,
      path: "/estoque",
      active: true
    },*/
    {
      title: "Produtos",
      description: "Gerencie seus produtos",
      icon: ShoppingCart,
      path: "/cadastro-produto",
      active: true
    },
    {
      title: "Insumos",
      description: "Cadastre seus insumos",
      icon: Beaker,
      path: "/cadastro-insumo",
      active: true
    },
    {
      title: "Margem",
      description: "Configure a margem padrão",
      icon: Percent,
      path: "/cadastro-margem",
      active: true
    },
    {
      title: "Plataformas",
      description: "Adicione plataformas de venda",
      icon: Package,
      path: "/cadastro-plataforma",
      active: true
    },
    {
      title: "Cadastro de Unidade",
      description: "Defina unidades de medida",
      icon: Ruler,
      path: "/cadastro-unidade",
      active: true
    },
    {
      title: "Cadastro da Loja",
      description: "Configure os dados da sua loja",
      icon: Store,
      path: "/cadastro-loja",
      active: true
    }/*,
    {
      title: "Clientes",
      description: "Cadastre seus clientes",
      icon: Users,
      path: "#",
      active: false
    },
    {
      title: "Relatórios",
      description: "Visualize relatórios"
    }*/
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-muted min-w-[52px] min-h-[52px]"
          >
            <ArrowLeft className="h-7 w-7 text-foreground" />
          </Button>

          <h1 className="text-base sm:text-lg font-bold text-primary">
            Cadastros
          </h1>

          {/* Espaço para manter centralização */}
          <div className="w-10 sm:w-11"></div>
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
                <BreadcrumbPage>Cadastros</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {cadastroOptions.map((option, index) => {
            const IconComponent = option.icon;
            
            const handleClick = () => {
              if (!option.active) return;
              
              // Check if data exists and redirect accordingly
              if (option.path === "/estoque") {
                navigate("/estoque");
              } else if (option.path === "/cadastro-produto") {
                const count = getStoredCount("produtos");
                navigate(count > 0 ? "/listagem-produtos" : "/cadastro-produto");
              } else if (option.path === "/cadastro-insumo") {
                const count = getStoredCount("insumos");
                navigate(count > 0 ? "/listagem-insumos" : "/cadastro-insumo");
              } else if (option.path === "/cadastro-margem") {
                const count = getStoredCount("margem");
                navigate(count ? "/listagem-margem" : "/cadastro-margem");
              } else if (option.path === "/cadastro-plataforma") {
                const count = getStoredCount("plataformas");
                navigate(count > 0 ? "/listagem-plataformas" : "/cadastro-plataforma");
              } else if (option.path === "/cadastro-unidade") {
                const count = getStoredCount("unidades");
                navigate(count > 0 ? "/listagem-unidades" : "/cadastro-unidade");
              } else if (option.path === "/cadastro-loja") {
                const count = getStoredCount("dadosLoja");
                navigate(count > 0 ? "/listagem-lojas" : "/cadastro-loja");
              }
            };

            return (
              <Card
                key={index}
                className={`shadow-sm transition-all duration-200 ${option.active ? "hover:shadow-md cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                onClick={handleClick}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${option.active ? "bg-primary" : "bg-muted"} flex items-center justify-center`}>
                        {IconComponent && <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${option.active ? "text-primary-foreground" : "text-muted-foreground"}`} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">{option.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block">
                        <Button variant="outline" size="default" disabled={!option.active} className="min-h-[44px]">
                          <Plus className="h-5 w-5 mr-1" /> Abrir
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}

          {/* Logout Button */}
          <Card
            className="shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer border-destructive/20"
            onClick={() => navigate("/")}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-destructive flex items-center justify-center">
                    <LogOut className="h-6 w-6 sm:h-7 sm:w-7 text-destructive-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">Sair</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Encerrar sessão</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Cadastros;