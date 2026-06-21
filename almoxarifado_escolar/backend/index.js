const express = require('express');
const pool = require('./connection');
const app = express();
const cors = require('cors'); app.use(cors());

app.use(express.json());


app.get('/produtos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM produto ORDER BY id');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/produtos', async (req, res) => {
  const { nome, descricao, estoque_critico, quantidade_estoque } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO produto (nome, descricao, estoque_critico, quantidade_estoque) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descricao, estoque_critico || 5, quantidade_estoque || 0]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, estoque_critico } = req.body;
  try {
    const resultado = await pool.query(
      'UPDATE produto SET nome = $1, descricao = $2, estoque_critico = $3 WHERE id = $4 RETURNING *',
      [nome, descricao, estoque_critico, id]
    );
    res.json({ message: 'Produto atualizado com sucesso!', produto: resultado.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produto WHERE id = $1', [id]);
    res.json({ message: 'Produto excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/entradas', async (req, res) => {
  const { id_produto, id_funcionario, quantidade } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO entrada_estoque (id_produto, id_funcionario, quantidade) VALUES ($1, $2, $3) RETURNING *',
      [id_produto, id_funcionario, quantidade]
    );
    res.status(201).json({ message: 'Entrada registrada e estoque atualizado!', dados: resultado.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/saidas', async (req, res) => {
  const { id_produto, id_funcionario, quantidade } = req.body;
  try {
    
    await pool.query('CALL registrar_saida_material($1, $2, $3)', [id_produto, id_funcionario, quantidade]);
    
    res.json({ message: 'Saída realizada com sucesso (Transação Confirmada)!' });
  } catch (err) {
    
    res.status(400).json({
      message: 'Falha na transação de saída.',
      error: err.message
    });
  }
});

app.get('/relatorios/criticos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM listar_produtos_criticos()');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});