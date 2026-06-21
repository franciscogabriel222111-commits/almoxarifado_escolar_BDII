# 🎒 Sistema de Almoxarifado Escolar
> **Documentação Técnica do Projeto e Guia de Execução Local**
> Disciplina: Banco de Dados II — Prof. João Paulo
> Instituto Federal do Piauí (IFPI) — Campus Picos [cite: 103, 104, 106]

Este arquivo consolida a fundamentação teórica, as regras de negócio implementadas e o guia prático passo a passo para implantar, executar e testar a aplicação na sua máquina local.

---

## 📋 1. Conteúdo Teórico e Regras de Negócio (Resumo dos Slides)

### 1.1. Contextualização do Problema
O gerenciamento manual de insumos didáticos e administrativos em instituições de ensino frequentemente resulta em descontrole de saldos, falta de previsibilidade e ausência de trilhas de auditoria. O objetivo fundamental deste projeto foi desenvolver uma aplicação conectada ao PostgreSQL que transfere a inteligência de negócio e as restrições críticas de integridade diretamente para o banco de dados através de objetos programáveis (PL/pgSQL). Isso garante que os dados permaneçam 100% íntegros, independentemente da plataforma cliente utilizada.

### 1.2. Arquitetura da Solução
A aplicação foi estruturada seguindo um modelo descentralizado em três camadas:
* **Frontend:** Interface de usuário limpa, minimalista e responsiva desenvolvida com HTML5, CSS3 e JavaScript Vanilla (puro). Comunica-se com o servidor de forma assíncrona usando a API nativa `fetch`.
* **Backend:** Servidor de aplicação construído em Node.js com Express.js. Funciona como uma API RESTful intermediária encarregada de receber as requisições HTTP e gerenciar o pool de conexões com o banco de dados por meio do driver nativo `pg`.
* **Banco de Dados:** PostgreSQL operando como o núcleo inteligente do sistema. É o responsável por armazenar as tabelas estruturadas, gerenciar chaves e aplicar as regras procedurais de automação e consistência.

### 1.3. Operações CRUD Completas de Produtos
O sistema gerencia o ciclo de vida completo dos materiais escolares cadastrados, permitindo as quatro operações básicas de persistência de dados:
* **Create (Cadastrar):** Inserção de novos materiais com a definição de nome, descrição, estoque crítico de segurança e saldo físico inicial.
* **Read (Listar):** Consulta dinâmica do inventário geral e carregamento automatizado de relatórios.
* **Update (Editar):** Atualização de informações cadastrais e limites de segurança de registros existentes.
* **Delete (Excluir):** Remoção física de materiais da base de dados, com integridade referencial configurada em cascata (`ON DELETE CASCADE`).

### 1.4. Inteligência do Banco: Functions e Triggers
* **PostgreSQL Functions (Funções):**
  * `consultar_estoque(id_produto)`: Função escalar que varre a tabela e retorna a quantidade exata de itens disponíveis. Serve de apoio direto para as validações da Procedure.
  * `listar_produtos_criticos()`: Função tabular que filtra em tempo real os materiais cujos saldos físicos estão iguais ou abaixo do limite crítico definido para reposição emergencial.
* **PostgreSQL Triggers (Gatilhos):**
  * `trigger_entrada_estoque`: Disparado de forma reativa após cada inclusão de lote na tabela de entradas. Ele incrementa o saldo físico do produto e gera o registro em log.
  * `trigger_saida_estoque`: Disparado após inserções na tabela de saídas. Reduz o saldo físico do material e gera o registro em log.
  * *Auditoria (`log_movimentacao`):* Grava de forma automatizada e imutável o histórico operacional, contendo o tipo da operação (ENTRADA/SAÍDA), quantidade, carimbo de data/hora e o detalhamento identificando o funcionário responsável.

### 1.5. Controle Transacional: Procedure de Saída
A regra mais sensível do almoxarifado — a retirada de materiais — é governada pela Procedure transacional `registrar_saida_material`, que encapsula toda a lógica de validação e persistência em um único bloco atômico. O fluxo de execução é o seguinte:
* **ROLLBACK (Reversão):** Caso a quantidade solicitada seja menor/igual a zero ou superior ao estoque real disponível, a Procedure aborta a operação imediatamente. Nenhuma modificação é salva, impedindo fisicamente saldos negativos ou inconsistências de inventário.
* **COMMIT (Confirmação):** Se o produto possuir saldo suficiente e o funcionário solicitante for válido, a Procedure executa o `INSERT` na tabela de saídas (o que aciona o gatilho automático de baixa e log) e consolida os dados permanentemente na base.

---

## 🛠️ 2. Guia de Configuração e Instalação Local

Siga as etapas abaixo para implantar e rodar o projeto completo no seu ambiente de desenvolvimento.

### 2.1. Pré-requisitos
Antes de começar, certifique-se de ter instalado:
1. **PostgreSQL** (Versão 14 ou superior) juntamente com o **pgAdmin 4**.
2. **Node.js** (Versão LTS estável).
3. Um editor de código (Recomendado: **VS Code**).

### 2.2. Passo 1: Configuração do Banco de Dados (PostgreSQL)
1. Abra o **pgAdmin 4** no seu computador.
2. No menu lateral esquerdo, clique com o botão direito sobre *Databases* e selecione **Create > Database...**
3. Defina o nome do banco de dados exatamente como: `almoxarifado_escolar` e clique em *Save*.
4. Clique sobre o banco de dados criado para selecioná-lo e abra a ferramenta de consultas clicando no ícone do **Query Tool** no menu superior.
5. Abra o arquivo `script_almoxarifado.sql` do seu projeto, copie todo o código contido nele, cole no painel do Query Tool e clique no botão **Execute (Play)**.
   * *O que este script faz?* Ele gera as 5 tabelas do sistema com suas respectivas constraints, cria as sequências autoincrementais, as Functions, os Triggers, a Procedure e insere dados iniciais de teste (2 funcionários e 3 produtos).

### 2.3. Passo 2: Configuração do Backend (Node.js)
1. Abra o terminal do seu sistema operacional (ou o terminal integrado do VS Code) e navegue até a pasta onde estão os arquivos do backend (`index.js` e `db.js`).
2. Inicialize o projeto Node executando o comando:
   ```bash
   npm init -y