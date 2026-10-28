# Healthcare

Portal de saúde desenvolvido com React, TypeScript, Vite e Bootstrap.

## Problema

Para marcar uma consulta ou exame, acompanhar campanhas de saúde e encontrar uma unidade próxima, a pessoa pode precisar procurar informações em canais diferentes. Essa separação dificulta visualizar, em um só lugar, os serviços disponíveis e as orientações de que precisa.

O Healthcare propõe uma interface simples que reúne esses caminhos em um portal voltado ao cidadão.

## Funcionalidades propostas

1. Agendamento online de consultas e exames em postos de saúde.
2. Notificações sobre campanhas de vacinação e prevenção.
3. Mapa de unidades de saúde, farmácias e hospitais.
4. Orientações sobre primeiros socorros e saúde mental.

## Telas exigidas

| Requisito | Rota | Nesta versão |
| --- | --- | --- |
| Login de acesso à área restrita | `#/login` | Valida e-mail e senha cadastrados e inicia uma sessão. |
| Esqueci minha senha | `#/forgot` | Permite trocar a senha usando o código de recuperação recebido no cadastro. |
| Logoff | `#/logout` | Encerra a sessão e retorna à tela pública. |
| Cadastro de usuário | `#/register` | Cria uma conta e mostra o código de recuperação uma única vez. |
| Página com conteúdo do tema | `#/inicio` | Portal de saúde acessível apenas após o login, com as quatro áreas abaixo. |

As áreas de conteúdo são `#/agendamentos`, `#/campanhas`, `#/unidades` e `#/orientacoes`.

## Como acessar a área restrita

- Inicie a aplicação e abra `http://localhost:5173`.
- Use **Cadastre-se** para criar uma conta com nome, e-mail e senha de pelo menos 8 caracteres.
- Guarde o código exibido após o cadastro. Entre com o e-mail e a senha criados. Não há conta administrativa pré-cadastrada: `admin@gmail.com` e `123` não dão acesso.
- **Esqueci minha senha** exige o e-mail, o código guardado e uma nova senha. Após a troca, salve o novo código que aparece.
- **Sair da conta** encerra a sessão. Acessar diretamente uma rota do portal sem sessão leva ao login.

As contas ficam em `server/data/users.json`, criado ao cadastrar a primeira pessoa e ignorado pelo Git. As senhas e códigos são armazenados como hashes. A sessão usa cookie `HttpOnly` e `SameSite=Strict` e expira após 8 horas ou no logoff. As sessões em memória são encerradas se o servidor reiniciar.

## Conteúdo do portal

- A navegação entre telas funciona, mas agendamentos, campanhas e orientações são conteúdo de demonstração, sem integração com postos de saúde.
- O mapa é interativo, usa o [OpenStreetMap](https://www.openstreetmap.org/) e busca locais pelo [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API). Ele começa em Fortaleza como exemplo; é possível arrastar o mapa e buscar na área exibida.
- A busca de locais depende de internet e da disponibilidade desses serviços públicos. Os dados podem estar incompletos ou desatualizados.

## Limites desta versão

A recuperação usa o código mostrado no cadastro porque não há serviço de e-mail integrado. Se ele for perdido, esta versão não oferece outro meio de recuperar a conta. Não há agendamento real, envio de notificações ou aconselhamento individual. O mapa não solicita a localização do usuário. O servidor local usa um arquivo JSON para contas; para publicação com dados reais, seria necessário um banco de dados, HTTPS, e-mail para recuperação e infraestrutura operacional adequada.

## Tecnologias e visual

React, TypeScript, Vite, Bootstrap, Bootstrap Icons e Leaflet. A paleta segue a proporção 60/30/10: fundo claro, verde-petróleo e coral. As imagens e logos estão em `public/images/`.

## Executar localmente

Requer Node.js e npm.

```bash
npm install
npm run dev
```

O comando inicia o servidor da API na porta 3001 e o Vite na porta 5173. Para executar a versão compilada, rode `npm run build` e `npm start`, abrindo `http://localhost:3001`. O endereço local usa HTTP; cookies seguros em produção exigem HTTPS.

Para verificar a compilação:

```bash
npm run build
```
