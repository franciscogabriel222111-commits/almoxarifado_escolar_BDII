-- =====================================================================
-- INSTITUTO FEDERAL DO PIAUÍ - CAMPUS PICOS
-- Disciplina: Banco de Dados II — Período: 2026.1
-- Professor: João Paulo
-- Trabalho Prático: Procedures, Functions e Triggers com Aplicação
-- Tema: Sistema de Almoxarifado Escolar
-- =====================================================================

-- =====================================================================
-- 1. LIMPEZA DE ESTRUTURAS ANTERIORES (Garante execução limpa do script)
-- =====================================================================
DROP PROCEDURE IF EXISTS registrar_saida_material;
DROP TRIGGER IF EXISTS trigger_saida_estoque ON saida_estoque;
DROP TRIGGER IF EXISTS trigger_entrada_estoque ON entrada_estoque;
DROP FUNCTION IF EXISTS tg_atualizar_estoque_saida;
DROP FUNCTION IF EXISTS tg_atualizar_estoque_entrada;
DROP FUNCTION IF EXISTS listar_produtos_criticos;
DROP FUNCTION IF EXISTS consultar_estoque;
DROP TABLE IF EXISTS log_movimentacao;
DROP TABLE IF EXISTS saida_estoque;
DROP TABLE IF EXISTS entrada_estoque;
DROP TABLE IF EXISTS produto;
DROP TABLE IF EXISTS funcionario;

-- =====================================================================
-- 2. CRIAÇÃO DAS TABELAS (DDL)
-- =====================================================================


CREATE TABLE funcionario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    cargo VARCHAR(50) NOT NULL
);


CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    quantidade_estoque INT DEFAULT 0 CHECK (quantidade_estoque >= 0),
    estoque_critico INT DEFAULT 5 NOT NULL
);


CREATE TABLE entrada_estoque (
    id SERIAL PRIMARY KEY,
    id_produto INT NOT NULL,
    id_funcionario INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_entrada_produto FOREIGN KEY (id_produto) REFERENCES produto(id) ON DELETE CASCADE,
    CONSTRAINT fk_entrada_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionario(id)
);


CREATE TABLE saida_estoque (
    id SERIAL PRIMARY KEY,
    id_produto INT NOT NULL,
    id_funcionario INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    data_saida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saida_produto FOREIGN KEY (id_produto) REFERENCES produto(id) ON DELETE CASCADE,
    CONSTRAINT fk_saida_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionario(id)
);


CREATE TABLE log_movimentacao (
    id SERIAL PRIMARY KEY,
    tipo_movimentacao VARCHAR(10) NOT NULL CHECK (tipo_movimentacao IN ('ENTRADA', 'SAIDA')),
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    data_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descricao TEXT
);

-- =====================================================================
-- 3. CRIAÇÃO DAS FUNCTIONS (PL/pgSQL)
-- =====================================================================


CREATE OR REPLACE FUNCTION consultar_estoque(p_id_produto INT)
RETURNS INT AS $$
DECLARE
    v_quantidade INT;
BEGIN
    SELECT quantidade_estoque INTO v_quantidade FROM produto WHERE id = p_id_produto;
    RETURN COALESCE(v_quantidade, 0);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION listar_produtos_criticos()
RETURNS TABLE(id INT, nome VARCHAR, quantidade_estoque INT, estoque_critico INT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.nome, p.quantidade_estoque, p.estoque_critico
    FROM produto p
    WHERE p.quantidade_estoque <= p.estoque_critico;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. CRIAÇÃO DOS GATILHOS (TRIGGERS)
-- =====================================================================


CREATE OR REPLACE FUNCTION tg_atualizar_estoque_entrada()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produto
    SET quantidade_estoque = quantidade_estoque + NEW.quantidade
    WHERE id = NEW.id_produto;

    INSERT INTO log_movimentacao (tipo_movimentacao, id_produto, quantidade, descricao)
    VALUES ('ENTRADA', NEW.id_produto, NEW.quantidade, 'Entrada de lote pelo funcionário ID ' || NEW.id_funcionario);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entrada_estoque
AFTER INSERT ON entrada_estoque
FOR EACH ROW EXECUTE FUNCTION tg_atualizar_estoque_entrada();



CREATE OR REPLACE FUNCTION tg_atualizar_estoque_saida()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produto
    SET quantidade_estoque = quantidade_estoque - NEW.quantidade
    WHERE id = NEW.id_produto;

    INSERT INTO log_movimentacao (tipo_movimentacao, id_produto, quantidade, descricao)
    VALUES ('SAIDA', NEW.id_produto, NEW.quantidade, 'Saída autorizada pelo funcionário ID ' || NEW.id_funcionario);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_saida_estoque
AFTER INSERT ON saida_estoque
FOR EACH ROW EXECUTE FUNCTION tg_atualizar_estoque_saida();

-- =====================================================================
-- 5. CRIAÇÃO DA PROCEDURE PRINCIPAL (Controle Transacional)
-- =====================================================================

CREATE OR REPLACE PROCEDURE registrar_saida_material(
    p_id_produto INT,
    p_id_funcionario INT,
    p_quantidade INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estoque_disponivel INT;
BEGIN
    
    v_estoque_disponivel := consultar_estoque(p_id_produto);
    
    
    IF p_quantidade <= 0 THEN
        RAISE NOTICE 'Erro: A quantidade de saída deve ser maior que zero.';
        ROLLBACK;
        RETURN;
    END IF;

    
    IF v_estoque_disponivel < p_quantidade THEN
        RAISE NOTICE 'Transação Abortada (ROLLBACK): Estoque insuficiente.';
        ROLLBACK;
        RETURN;
    END IF;

    
    INSERT INTO saida_estoque (id_produto, id_funcionario, quantidade)
    VALUES (p_id_produto, p_id_funcionario, p_quantidade);

    
    COMMIT;
END;
$$;

-- =====================================================================
-- 6. CARGA INICIAL DE TESTE (DML) - Evita erros de chaves estrangeiras
-- =====================================================================
INSERT INTO funcionario (nome, matricula, cargo) VALUES 
('Professor João Paulo', 'IFPI202601', 'Docente BD2'),
('Carlos Almoxarife', 'ALM202602', 'Assistente de Logística');

INSERT INTO produto (nome, descricao, quantidade_estoque, estoque_critico) VALUES 
('Piloto de Quadro Azul', 'Marcadores recarregáveis para quadro branco', 10, 5),
('Lápis de Cor Faber', 'Caixas com 24 cores para atividades artísticas', 20, 5),
('Resma de Papel A4', 'Papel sulfite alcalino de gramatura 75g', 3, 5);