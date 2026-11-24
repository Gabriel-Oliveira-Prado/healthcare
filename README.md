# Healthcare

Portal de saúde desenvolvido com React, TypeScript, Vite e Bootstrap.

## Problema

Para marcar uma consulta ou exame, acompanhar campanhas de saúde e encontrar uma unidade próxima, a pessoa pode precisar procurar informações em canais diferentes. Essa separação dificulta visualizar, em um só lugar, os serviços disponíveis e as orientações de que precisa.

O Healthcare propõe uma interface simples que reúne esses caminhos em um portal voltado ao cidadão.

## Objetivo

Oferecer uma aplicação React navegável que centralize o acesso a informações e serviços básicos de saúde. Nesta etapa, o foco é demonstrar a experiência de uso, a organização das telas e o fluxo de acesso à área restrita.

## Integrantes

- Gabriel Oliveira
- Marcelo Justino
- Pedro Henrique Canto Bezerra
- Carlos Henrique

O planejamento do grupo está no [quadro do Trello](https://trello.com/b/KRnf6XEe/trabalho-uninassau). As contribuições de código de cada pessoa devem ser identificadas pelo autor dos commits e pelos Pull Requests no [repositório do GitHub](https://github.com/Gabriel-Oliveira-Prado/healthcare).

## Funcionalidades propostas

1. Agendamento online de consultas e exames em postos de saúde.
2. Notificações sobre campanhas de vacinação e prevenção.
3. Mapa de unidades de saúde, farmácias e hospitais.
4. Orientações sobre primeiros socorros e saúde mental.

## Telas exigidas

| Requisito                       | Rota         | Nesta versão                                                                                                                    |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro de usuário             | `#/register` | Nome e sobrenome, e-mail, senha (8+ caracteres, com letra e número) e confirmação, com erros por campo. Impede e-mail repetido. |
| Login de acesso à área restrita | `#/login`    | Valida e-mail e senha cadastrados e inicia uma sessão simulada (8 horas).                                                       |
| Esqueci minha senha             | `#/forgot`   | Pede o e-mail, "envia" um código de 6 números (exibido na tela como e-mail simulado) e define a nova senha.                     |
| Logoff                          | `#/logout`   | Encerra a sessão e volta para a tela pública.                                                                                   |
| Página com conteúdo do tema     | `#/inicio`   | Portal de saúde acessível apenas com login, com as quatro áreas abaixo.                                                         |

As áreas de conteúdo são `#/agendamentos`, `#/campanhas`, `#/unidades` e `#/orientacoes`.

## Como funciona a autenticação (simulada)

Não há servidor: contas, sessão e códigos de recuperação ficam no `localStorage` do navegador (`src/auth/authService.ts`). Senhas são guardadas com hash SHA-256 e sal, nunca em texto puro, mas isso **não** substitui a segurança de um back-end real.

- **Rotas protegidas:** `ProtectedRoute` (`src/components/RouteGuards.tsx`) só renderiza o portal com sessão válida. Sem sessão, a pessoa vai para o login com um aviso e, depois de entrar, volta para a página que tentou abrir. Quem já está logado e abre `#/login`, `#/register` ou `#/forgot` é levado ao portal. A sessão é revalidada a cada navegação e sincronizada entre abas.
- **Recuperação:** o código vale 15 minutos, pode ser usado uma vez e é bloqueado após 5 tentativas erradas. Trocar a senha encerra a sessão aberta.
- **Validação:** regras em `src/auth/validation.ts`; o erro de cada campo aparece ao sair dele ou ao enviar o formulário.
- Não existe conta pré-cadastrada: crie uma em **Cadastre-se**. Para limpar os dados de teste, apague o armazenamento local do site no navegador.

## Conteúdo do portal

- A navegação entre telas funciona, mas agendamentos, campanhas e orientações são conteúdo de demonstração, sem integração com postos de saúde.
- O mapa é interativo, usa o [OpenStreetMap](https://www.openstreetmap.org/) e busca locais pelo [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API). Ele começa em Fortaleza como exemplo; é possível arrastar o mapa e buscar na área exibida.
- A busca de locais depende de internet e da disponibilidade desses serviços públicos. Os dados podem estar incompletos ou desatualizados.

## Limites desta versão

O login, o cadastro e a recuperação são simulações no navegador: os dados não saem do aparelho, não há e-mail real e qualquer pessoa com acesso ao navegador pode ler o armazenamento local. Não há agendamento real, envio de notificações ou aconselhamento individual. O mapa não solicita a localização do usuário. Para publicação com dados reais seria necessário back-end com banco de dados, HTTPS e serviço de e-mail.

A pasta `server/` guarda uma API Node anterior (sessão por cookie, hashes scrypt). O front-end não a usa mais; ela continua disponível com `npm run dev:api` e `npm run test:api`, e pode ser removida.

## Tecnologias e visual

React, TypeScript, Vite, Bootstrap, Bootstrap Icons e Leaflet. A paleta segue a proporção 60/30/10: fundo claro, verde-petróleo e coral. As imagens e logos estão em `public/images/`.

## Executar localmente

Requer Node.js e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Para verificar a compilação e os testes (validação, serviço de autenticação e fluxos de tela):

```bash
npm run build
npm test
```
