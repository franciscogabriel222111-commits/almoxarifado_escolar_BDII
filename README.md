# 🎒 Sistema de Almoxarifado Escolar
> **Documentação Técnica do Projeto e Guia de Execução Local**
> Disciplina: Banco de Dados II — Prof. João Paulo
> [cite_start]Instituto Federal do Piauí (IFPI) — Campus Picos [cite: 103, 104, 106]

[cite_start]Este arquivo consolida a fundamentação teórica, as regras de negócio implementadas e o guia prático passo a passo para implantar, executar e testar a aplicação na sua máquina local.

---

## 📋 1. Conteúdo Teórico e Regras de Negócio (Resumo dos Slides)

### 1.1. Contextualização do Problema
[cite_start]O gerenciamento manual de insumos didáticos e administrativos em instituições de ensino frequentemente resulta em descontrole de saldos, falta de previsibilidade e ausência de trilhas de auditoria[cite: 125]. [cite_start]O objetivo fundamental deste projeto foi desenvolver uma aplicação conectada ao PostgreSQL que transfere a inteligência de negócio e as restrições críticas de integridade diretamente para o banco de dados através de objetos programáveis (PL/pgSQL)[cite: 108, 135]. [cite_start]Isso garante que os dados permaneçam 100% íntegros, independentemente da plataforma cliente utilizada[cite: 109].

### 1.2. Arquitetura da Solução
[cite_start]A aplicação foi estruturada seguindo um modelo descentralizado em três camadas[cite: 41]:
* [cite_start]**Frontend:** Interface de usuário limpa, minimalista e responsiva desenvolvida com HTML5, CSS3 e JavaScript Vanilla (puro). [cite_start]Comunica-se com o servidor de forma assíncrona usando a API nativa `fetch`[cite: 95].
* [cite_start]**Backend:** Servidor de aplicação construído em Node.js com Express.js[cite: 43]. [cite_start]Funciona como uma API RESTful intermediária encarregada de receber as requisições HTTP e gerenciar o pool de conexões com o banco de dados por meio do driver nativo `pg`[cite: 90, 91, 92].
* [cite_start]**Banco de Dados:** PostgreSQL operando como o núcleo inteligente do sistema[cite: 44]. [cite_start]É o responsável por armazenar as tabelas estruturadas, gerenciar chaves e aplicar as regras procedurais de automação e consistência[cite: 46].

### 1.3. Operações CRUD Completas de Produtos
[cite_start]O sistema gerencia o ciclo de vida completo dos materiais escolares cadastrados[cite: 48, 110]:
* [cite_start]**Create (Cadastrar):** Inserção de novos materiais com a definição de nome, descrição, estoque crítico de segurança e saldo físico inicial[cite: 48].
* [cite_start]**Read (Listar):** Consulta dinâmica do inventário geral e carregamento automatizado de relatórios[cite: 52].
* **Update (Editar):** Atualização de informações cadastrais e limites de segurança de registros existentes.
* **Delete (Excluir):** Remoção física de materiais da base de dados, com integridade referencial configurada em cascata (`ON DELETE CASCADE`).

### 1.4. Inteligência do Banco: Functions e Triggers
* **PostgreSQL Functions (Funções):**
  * [cite_start]`consultar_estoque(id_produto)`: Função escalar que varre a tabela e retorna a quantidade exata de itens disponíveis[cite: 68]. [cite_start]Serve de apoio direto para as validações da Procedure[cite: 118].
  * [cite_start]`listar_produtos_criticos()`: Função tabular que filtra em tempo real os materiais cujos saldos físicos estão iguais ou abaixo do limite crítico definido para reposição emergencial.
* **PostgreSQL Triggers (Gatilhos):**
  * `trigger_entrada_estoque`: Disparado de forma reativa após cada inclusão de lote na tabela de entradas. [cite_start]Ele incrementa o saldo físico do produto e gera o registro em log[cite: 71, 73].
  * `trigger_saida_estoque`: Disparado após inserções na tabela de saídas. [cite_start]Reduz o saldo físico do material e gera o registro em log[cite: 72, 73].
  * [cite_start]*Auditoria (`log_movimentacao`):* Grava de forma automatizada e imutável o histórico operacional, contendo o tipo da operação (ENTRADA/SAÍDA), quantidade, carimbo de data/hora e o detalhamento identificando o funcionário responsável[cite: 59, 73].

### 1.5. Controle Transacional: Procedure de Saída
[cite_start]A regra mais sensível do almoxarifado — a retirada de materiais — é governada pela Procedure transacional `registrar_saida_material`[cite: 60, 61]:
* **ROLLBACK (Reversão):** Caso a quantidade solicitada seja menor/igual a zero ou superior ao estoque real disponível, a Procedure aborta a operação imediatamente. [cite_start]Nenhuma modificação é salva, impedindo fisicamente saldos negativos ou inconsistências de inventário[cite: 114, 115].
* [cite_start]**COMMIT (Confirmação):** Se o produto possuir saldo suficiente e o funcionário solicitante for válido, a Procedure executa o `INSERT` na tabela de saídas (o que aciona o gatilho automático de baixa e log) e consolida os dados permanentemente na base[cite: 114, 117].

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
   * [cite_start]*O que este script faz?* Ele gera as 5 tabelas do sistema com suas respectivas constraints, cria as sequências autoincrementais, as Functions, os Triggers, a Procedure e insere dados iniciais de teste (2 funcionários e 3 produtos)[cite: 54, 60, 67, 70].

### 2.3. Passo 2: Configuração do Backend (Node.js)
1. Abra o terminal do seu sistema operacional (ou o terminal integrado do VS Code) e navegue até a pasta onde estão os arquivos do backend (`index.js` e `db.js`).
2. Inicialize o projeto Node executando o comando:
   ```bash
   npm init -y