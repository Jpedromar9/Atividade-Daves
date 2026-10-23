// 1. PEGANDO OS ELEMENTOS DO HTML
const form = document.getElementById('form-cadastro');
const inputNome = document.getElementById('nome');
const inputCep = document.getElementById('cep');
const botao = document.getElementById('btn-cadastrar');
const statusText = document.getElementById('status');
const divEndereco = document.getElementById('endereco');
const lista = document.getElementById('lista-usuarios');

// 2. PERSISTÊNCIA (localStorage)
// Pega os usuários salvos. Se não tiver nada, começa com lista vazia
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

function salvarUsuarios() {
    // localStorage só guarda texto, então transformo em JSON
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// 3. MOSTRAR A LISTA NA TELA
function mostrarLista() {
    lista.innerHTML = ''; // limpa antes de desenhar de novo

    if (usuarios.length === 0) {
        lista.innerHTML = '<li>Nenhum usuário cadastrado ainda.</li>';
        return;
    }

    usuarios.forEach(function (usuario) {
        const li = document.createElement('li');

        // mostra o nome e a cidade do usuário
        const texto = document.createElement('span');
        texto.textContent = usuario.nome + ' - ' + usuario.cidade + '/' + usuario.uf;

        // botão de apagar (guardo o id no data-id pra saber qual apagar)
        const btnApagar = document.createElement('button');
        btnApagar.textContent = 'Apagar';
        btnApagar.classList.add('btn-apagar');
        btnApagar.dataset.id = usuario.id;

        li.appendChild(texto);
        li.appendChild(btnApagar);
        lista.appendChild(li);
    });
}

// 4. BUSCAR O CEP NO VIACEP (async/await com fetch)
async function buscarCep(cep) {
    const resposta = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
    const dados = await resposta.json();
    return dados;
}

// 5. MOSTRAR O ENDEREÇO NA TELA
function mostrarEndereco(dados) {
    divEndereco.innerHTML =
        '<strong>Endereço encontrado:</strong><br>' +
        'CEP: ' + dados.cep + '<br>' +
        'Rua: ' + dados.logradouro + '<br>' +
        'Bairro: ' + dados.bairro + '<br>' +
        'Cidade: ' + dados.localidade + ' - ' + dados.uf + '<br>' +
        'Estado: ' + dados.estado + '<br>' +
        'DDD: ' + dados.ddd;
    divEndereco.classList.remove('escondido');
}

// 6. CADASTRAR O USUÁRIO (quando enviar o formulário)
async function cadastrar(evento) {
    evento.preventDefault(); // impede a página de recarregar

    const nome = inputNome.value.trim();
    // tira tudo que não for número (tipo o hífen)
    const cep = inputCep.value.replace(/\D/g, '');

    // validações
    if (nome === '') {
        statusText.textContent = 'Status: Digite o nome!';
        return;
    }
    if (cep === '') {
        statusText.textContent = 'Status: O CEP é obrigatório!';
        return;
    }
    if (cep.length !== 8) {
        statusText.textContent = 'Status: O CEP precisa ter 8 números.';
        return;
    }

    try {
        botao.classList.add('ativo');
        botao.textContent = 'Buscando CEP...';
        botao.disabled = true;
        statusText.textContent = 'Status: Consultando o ViaCEP...';

        const dados = await buscarCep(cep);
        console.log('Resposta do ViaCEP:', dados);

        // o ViaCEP devolve { erro: true } quando o CEP não existe
        if (dados.erro) {
            statusText.textContent = 'Status: CEP não encontrado.';
            divEndereco.classList.add('escondido');
            return;
        }

        mostrarEndereco(dados);

        // monta o objeto do usuário
        const novoUsuario = {
            id: Date.now(), // id único usando a hora atual
            nome: nome,
            cep: dados.cep,
            cidade: dados.localidade,
            uf: dados.uf,
            endereco: dados.logradouro + ', ' + dados.bairro
        };

        usuarios.push(novoUsuario);
        salvarUsuarios();
        mostrarLista();

        statusText.textContent = 'Status: Usuário cadastrado com sucesso!';
        form.reset();
    } catch (erro) {
        statusText.textContent = 'Status: Erro ao consultar o CEP. Verifique a internet.';
        console.error('Erro na requisição:', erro);
    } finally {
        // volta o botão ao normal, dando certo ou não
        botao.classList.remove('ativo');
        botao.textContent = 'Cadastrar';
        botao.disabled = false;
    }
}

// 7. APAGAR USUÁRIO
function apagarUsuario(id) {
    // filter deixa só os usuários com id diferente do que quero apagar
    usuarios = usuarios.filter(function (usuario) {
        return usuario.id !== id;
    });
    salvarUsuarios();
    mostrarLista();
    statusText.textContent = 'Status: Usuário apagado.';
}

// 8. EVENTOS
form.addEventListener('submit', cadastrar);

// delegação de eventos: o clique fica no <ul> e eu vejo se foi no botão apagar
lista.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-apagar')) {
        const id = Number(e.target.dataset.id);
        if (confirm('Quer mesmo apagar esse usuário?')) {
            apagarUsuario(id);
        }
    }
});

// quando a página abrir, já mostra quem estava salvo
mostrarLista();
