const API_URL = 'http://localhost:3000';


document.getElementById('form-produto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        nome: document.getElementById('prod-nome').value,
        descricao: document.getElementById('prod-descricao').value,
        estoque_critico: parseInt(document.getElementById('prod-critico').value) || 5,
        quantidade_estoque: parseInt(document.getElementById('prod-quantidade').value) || 0 // Atualização
    };

    try {
        const res = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert('Produto cadastrado com sucesso!');
            document.getElementById('form-produto').reset();
            carregarProdutos();
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
    }
});


document.getElementById('btn-entrada').addEventListener('click', async () => {
    const dados = obterDadosMovimentacao();
    if (!dados) return;

    try {
        const res = await fetch(`${API_URL}/entradas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const resultado = await res.json();
        alert(resultado.message || 'Entrada registrada!');
        carregarProdutos();
    } catch (err) {
        alert('Erro ao registrar entrada.');
    }
});


document.getElementById('btn-saida').addEventListener('click', async () => {
    const dados = obterDadosMovimentacao();
    if (!dados) return;

    try {
        const res = await fetch(`${API_URL}/saidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const resultado = await res.json();
        
        if (res.ok) {
            alert(` ${resultado.message}`);
        } else {
            alert(` ${resultado.message}\nMotivo: ${resultado.error}`); // Transação Abortada (Rollback)
        }
        carregarProdutos();
    } catch (err) {
        alert('Erro de comunicação com a API.');
    }
});


function obterDadosMovimentacao() {
    const id_produto = parseInt(document.getElementById('mov-produto').value);
    const id_funcionario = parseInt(document.getElementById('mov-funcionario').value);
    const quantidade = parseInt(document.getElementById('mov-quantidade').value);

    if (!id_produto || !id_funcionario || !quantidade) {
        alert('Por favor, preencha todos os campos da movimentação.');
        return null;
    }
    return { id_produto, id_funcionario, quantidade };
}


async function carregarProdutos() {
    const cabecalho = document.getElementById('cabecalho-tabela');
    const corpo = document.getElementById('corpo-tabela');
    
    
    cabecalho.innerHTML = `<th>ID</th><th>Nome</th><th>Qtd Estoque</th><th>Limite Crítico</th><th>Ações</th>`;
    corpo.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/produtos`);
        const produtos = await res.json();
        
        corpo.innerHTML = '';
        produtos.forEach(p => {
            corpo.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.nome}</strong></td>
                    <td>${p.quantidade_estoque}</td>
                    <td>${p.estoque_critico}</td>
                    <td>
                        <button onclick="editarProduto(${p.id}, '${p.nome}', '${p.descricao}', ${p.estoque_critico})" style="width:auto; padding:5px 10px; margin-right:5px; background-color:#3498db; display:inline-block;">✏️</button>
                        <button onclick="excluirProduto(${p.id})" style="width:auto; padding:5px 10px; background-color:var(--danger); display:inline-block;">🗑️</button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        corpo.innerHTML = '<tr><td colspan="5">Erro ao listar produtos.</td></tr>';
    }
}


async function carregarCriticos() {
    const cabecalho = document.getElementById('cabecalho-tabela');
    const corpo = document.getElementById('corpo-tabela');
    
    cabecalho.innerHTML = `<th>ID</th><th>Produto em Risco</th><th>Estoque Atual</th><th>Limite Alvo</th>`;
    corpo.innerHTML = '<tr><td colspan="4">Buscando dados críticos...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/relatorios/criticos`);
        const produtos = await res.json();
        
        corpo.innerHTML = '';
        if(produtos.length === 0) {
            corpo.innerHTML = '<tr><td colspan="4" style="color: var(--success); text-align: center;">✅ Nenhum produto em estado crítico!</td></tr>';
            return;
        }

        produtos.forEach(p => {
            corpo.innerHTML += `
                <tr style="background-color: #fdf2e9;">
                    <td>${p.id}</td>
                    <td style="color: var(--danger); font-weight: bold;"> ${p.nome}</td>
                    <td style="color: var(--danger); font-weight: bold;">${p.quantidade_estoque}</td>
                    <td>${p.estoque_critico}</td>
                </tr>`;
        });
    } catch (err) {
        corpo.innerHTML = '<tr><td colspan="4">Erro ao gerar relatório crítico.</td></tr>';
    }
}


async function excluirProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    
    try {
        const res = await fetch(`${API_URL}/produtos/${id}`, { 
            method: 'DELETE' 
        });
        if (res.ok) {
            alert('Produto removido com sucesso!');
            carregarProdutos();
        } else {
            const erro = await res.json();
            alert(`Erro ao excluir: ${erro.error}`);
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor para exclusão.');
    }
}


async function editarProduto(id, nomeAtual, descricaoAtual, criticoAtual) {
    const novoNome = prompt('Novo nome do produto:', nomeAtual);
    if (novoNome === null) return; 
    
    const novaDescricao = prompt('Nova descrição:', descricaoAtual);
    const novoCritico = prompt('Novo estoque crítico:', criticoAtual);

    const dados = {
        nome: novoNome,
        descricao: novaDescricao,
        estoque_critico: parseInt(novoCritico) || 5
    };

    try {
        const res = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert('Produto atualizado com sucesso!');
            carregarProdutos();
        } else {
            const erro = await res.json();
            alert(`Erro ao atualizar: ${erro.error}`);
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor para atualização.');
    }
}