let dados = [];

const COL = {
  id: "ID",
  local: "Local",
  km: "KM",
  estaca: "Estaca",
  categoria: "Categoria",
  disciplina: "Disciplina",
  responsavel: "Responsável",
  status: "Status",
  terminoPrev: "Termino_Prev",
  statusPrazo: "Status_Prazo",
  classificacaoEscopo: "Classificacao_Escopo",
  exibirDashboard: "Exibir_Dashboard",
  pendencia: "Pendência",
  observacoes: "Observações",
  statusExec: "Status_Executivo",
  corWeb: "Cor_Web",
  tagWeb: "Tag_Web",
  prioridade: "Prioridade"
};

const CORES = {
  amBlue: "#0f2f4a",
  blue: "#2f80ed",
  green: "#2e7d32",
  yellow: "#f9a825",
  red: "#c62828",
  purple: "#6a1b9a",
  gray: "#8ea2ba",
  panel: "#102c47",
  text: "#ffffff"
};

document.addEventListener("DOMContentLoaded", () => {
  carregarDados();

  ["filtroLocal", "filtroKM", "filtroStatus", "filtroCategoria", "filtroEscopo"].forEach(id => {
    document.getElementById(id).addEventListener("change", atualizarDashboard);
  });

  document.getElementById("limparFiltros").addEventListener("click", limparFiltros);
});

async function carregarDados() {
  try {
    const resposta = await fetch("dashboard_data.csv");

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar dashboard_data.csv");
    }

    const texto = await resposta.text();

    dados = csvParaObjetos(texto)
      .filter(item => item[COL.id])
      .filter(item => normalizar(item[COL.exibirDashboard]) !== "nao")
      .map(padronizarRegistro);

    preencherFiltros();
    atualizarDashboard();

    console.log("CSV carregado com sucesso:", dados);
  } catch (erro) {
    console.error("Erro ao carregar CSV:", erro);
    alert("Erro ao carregar dashboard_data.csv. Verifique se o arquivo está na mesma pasta do index.html.");
  }
}

function csvParaObjetos(csv) {
  const linhas = parseCSV(csv.trim());
  const cabecalho = linhas[0].map(h => limparTexto(h));

  return linhas.slice(1).map(linha => {
    const obj = {};

    cabecalho.forEach((coluna, index) => {
      obj[coluna] = limparTexto(linha[index] || "");
    });

    return obj;
  });
}

function parseCSV(texto) {
  const linhas = [];
  let linha = [];
  let valor = "";
  let dentroAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const prox = texto[i + 1];

    if (char === '"' && dentroAspas && prox === '"') {
      valor += '"';
      i++;
    } else if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === "," && !dentroAspas) {
      linha.push(valor);
      valor = "";
    } else if ((char === "\n" || char === "\r") && !dentroAspas) {
      if (valor || linha.length > 0) {
        linha.push(valor);
        linhas.push(linha);
        linha = [];
        valor = "";
      }

      if (char === "\r" && prox === "\n") {
        i++;
      }
    } else {
      valor += char;
    }
  }

  if (valor || linha.length > 0) {
    linha.push(valor);
    linhas.push(linha);
  }

  return linhas;
}

function limparTexto(valor) {
  return String(valor || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim();
}

function normalizar(valor) {
  return limparTexto(valor)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function padronizarRegistro(item) {
  const statusNorm = normalizar(item[COL.status]);
  const escopoNorm = normalizar(item[COL.classificacaoEscopo]);

  if (statusNorm === "nao iniciado") item[COL.status] = "Não iniciado";
  if (statusNorm === "em andamento") item[COL.status] = "Em andamento";
  if (statusNorm === "concluido") item[COL.status] = "Concluído";

  if (escopoNorm === "fora escopo") item[COL.classificacaoEscopo] = "Fora Escopo";
  if (escopoNorm === "aguardando definicao") item[COL.classificacaoEscopo] = "Aguardando Definição";
  if (escopoNorm === "executar") item[COL.classificacaoEscopo] = "Executar";

  return item;
}

function preencherFiltros() {
  preencherFiltro("filtroLocal", dados.map(d => d[COL.local]), "Local");
  preencherFiltro("filtroKM", dados.map(d => d[COL.km]), "KM / Região");
  preencherFiltro("filtroStatus", dados.map(d => d[COL.status]), "Status");
  preencherFiltro("filtroCategoria", dados.map(d => d[COL.categoria]), "Categoria");
  preencherFiltro("filtroEscopo", dados.map(d => d[COL.classificacaoEscopo]), "Escopo");
}

function preencherFiltro(id, valores, label) {
  const filtro = document.getElementById(id);
  const valorAtual = filtro.value;

  filtro.innerHTML = "";

  const optionTodos = document.createElement("option");
  optionTodos.value = "Todos";
  optionTodos.textContent = label;
  filtro.appendChild(optionTodos);

  const valoresUnicos = [...new Set(valores.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  valoresUnicos.forEach(valor => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = valor;
    filtro.appendChild(option);
  });

  if ([...filtro.options].some(option => option.value === valorAtual)) {
    filtro.value = valorAtual;
  }
}

function limparFiltros() {
  ["filtroLocal", "filtroKM", "filtroStatus", "filtroCategoria", "filtroEscopo"].forEach(id => {
    document.getElementById(id).value = "Todos";
  });

  atualizarDashboard();
}

function atualizarDashboard() {
  const local = document.getElementById("filtroLocal").value;
  const km = document.getElementById("filtroKM").value;
  const status = document.getElementById("filtroStatus").value;
  const categoria = document.getElementById("filtroCategoria").value;
  const escopo = document.getElementById("filtroEscopo").value;

  const dadosFiltrados = dados.filter(d => {
    return (
      (local === "Todos" || d[COL.local] === local) &&
      (km === "Todos" || d[COL.km] === km) &&
      (status === "Todos" || d[COL.status] === status) &&
      (categoria === "Todos" || d[COL.categoria] === categoria) &&
      (escopo === "Todos" || d[COL.classificacaoEscopo] === escopo)
    );
  });

  atualizarKPIs(dadosFiltrados);
  atualizarTabela(dadosFiltrados);
  atualizarGraficos(dadosFiltrados);
}

function atualizarKPIs(lista) {
  const total = lista.length;

  const concluidas = lista.filter(d => isConcluido(d)).length;

  const backlogEmpreiteira = lista.filter(d =>
    isExecutar(d) && !isConcluido(d)
  ).length;

  const totalEscopoEmpreiteira = lista.filter(d => isExecutar(d)).length;

  const foraEscopo = lista.filter(d =>
    normalizar(d[COL.classificacaoEscopo]) === "fora escopo"
  ).length;

  const aguardandoDefinicao = lista.filter(d =>
    normalizar(d[COL.classificacaoEscopo]) === "aguardando definicao"
  ).length;

  document.getElementById("badgeTotal").innerText = total;
  document.getElementById("totalPunchList").innerText = total;
  document.getElementById("totalConcluidas").innerText = concluidas;
  document.getElementById("totalBacklogEmpreiteira").innerText = backlogEmpreiteira;
  document.getElementById("totalForaEscopo").innerText = foraEscopo;
  document.getElementById("totalAguardandoDefinicao").innerText = aguardandoDefinicao;
  document.getElementById("hintEmpreiteira").innerText = `${totalEscopoEmpreiteira} itens no escopo da empreiteira`;
}

function atualizarTabela(lista) {
  const tbody = document.querySelector("#tabelaPendencias tbody");
  tbody.innerHTML = "";

  const ordenados = [...lista].sort((a, b) => {
    const prioA = Number(a[COL.prioridade] || 99);
    const prioB = Number(b[COL.prioridade] || 99);

    if (prioA !== prioB) return prioA - prioB;

    return String(a[COL.id]).localeCompare(String(b[COL.id]), "pt-BR", { numeric: true });
  });

  ordenados.forEach(d => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHTML(d[COL.id])}</td>
      <td>${escapeHTML(d[COL.local])}</td>
      <td>${escapeHTML(d[COL.km])}</td>
      <td>${escapeHTML(d[COL.estaca])}</td>
      <td>${escapeHTML(d[COL.categoria])}</td>
      <td>${escapeHTML(d[COL.pendencia])}</td>
      <td>${criarBadgeStatus(d[COL.status])}</td>
      <td>${criarBadgeEscopo(d[COL.classificacaoEscopo])}</td>
      <td>${formatarDataTabela(d[COL.terminoPrev])}</td>
      <td>${criarBadgeExecutivo(d[COL.statusExec])}</td>
    `;

    tbody.appendChild(tr);
  });
}

function atualizarGraficos(lista) {
  atualizarGraficoResponsabilidade(lista);
  atualizarGraficoStatus(lista);
  atualizarGraficoCategoria(lista);
  atualizarGraficoTerminos(lista);
}

function atualizarGraficoResponsabilidade(lista) {
  const contagem = contarPor(lista, COL.classificacaoEscopo);
  const labels = ordenarLabels(Object.keys(contagem), ["Executar", "Fora Escopo", "Aguardando Definição"]);
  const valores = labels.map(label => contagem[label]);

  criarOuAtualizarGrafico("chartResponsabilidade", "graficoResponsabilidade", {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: labels.map(corEscopo),
        borderColor: "#102c47",
        borderWidth: 3
      }]
    },
    options: opcoesDonut()
  });
}

function atualizarGraficoStatus(lista) {
  const contagem = contarPor(lista, COL.status);
  const labels = ordenarLabels(Object.keys(contagem), ["Não iniciado", "Em andamento", "Concluído"]);
  const valores = labels.map(label => contagem[label]);

  criarOuAtualizarGrafico("chartStatus", "graficoStatus", {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: labels.map(corStatus),
        borderColor: "#102c47",
        borderWidth: 3
      }]
    },
    options: opcoesDonut()
  });
}

function atualizarGraficoCategoria(lista) {
  const pendenciasAbertas = lista.filter(d => !isConcluido(d));
  const contagem = contarPor(pendenciasAbertas, COL.categoria);

  const itens = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1]);

  const labels = itens.map(item => item[0]);
  const valores = itens.map(item => item[1]);

  criarOuAtualizarGrafico("chartCategoria", "graficoCategoria", {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Pendências abertas",
        data: valores,
        backgroundColor: "#2f80ed",
        borderRadius: 8,
        barThickness: 22
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw} pendência(s) aberta(s)`
          }
        }
      },
      scales: opcoesEscalasBarras()
    }
  });
}

function atualizarGraficoTerminos(lista) {
  const contagem = {};

  lista.forEach(d => {
    const chave = chaveDataTermino(d[COL.terminoPrev]);
    contagem[chave] = (contagem[chave] || 0) + 1;
  });

  const labels = Object.keys(contagem).sort((a, b) => {
    if (a === "Sem planejamento") return 1;
    if (b === "Sem planejamento") return -1;

    return converterDataParaOrdenacao(a) - converterDataParaOrdenacao(b);
  });

  const valores = labels.map(label => contagem[label]);

  criarOuAtualizarGrafico("chartTerminos", "graficoTerminos", {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantidade",
        data: valores,
        backgroundColor: labels.map(label =>
          label === "Sem planejamento" ? "#8ea2ba" : "#0f2f4a"
        ),
        borderRadius: 8,
        barThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw} item(ns)`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#b7c4d6" },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: "#b7c4d6"
          },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function criarOuAtualizarGrafico(nomeGlobal, canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (window[nomeGlobal]) {
    window[nomeGlobal].destroy();
  }

  window[nomeGlobal] = new Chart(canvas, config);
}

function opcoesDonut() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#d6e4f5",
          boxWidth: 14,
          padding: 16,
          font: {
            size: 12,
            weight: "bold"
          },
          generateLabels: function(chart) {
            const data = chart.data;
            const dataset = data.datasets[0];
            const total = dataset.data.reduce((acc, value) => acc + Number(value || 0), 0);

            return data.labels.map((label, index) => {
              const valor = Number(dataset.data[index] || 0);
              const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : "0.0";

              return {
                text: `${label} - ${valor} (${percentual}%)`,
                fillStyle: dataset.backgroundColor[index],
                strokeStyle: dataset.backgroundColor[index],
                color: "#ffffff",
                fontColor: "#ffffff",
                lineWidth: 1,
                hidden: false,
                index: index
              };
            });
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const dataset = ctx.dataset;
            const total = dataset.data.reduce((acc, value) => acc + Number(value || 0), 0);
            const valor = Number(ctx.raw || 0);
            const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : "0.0";

            return ` ${ctx.label}: ${valor} (${percentual}%)`;
          }
        }
      }
    }
  };
}

function opcoesEscalasBarras() {
  return {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: "#b7c4d6"
      },
      grid: { color: "rgba(255,255,255,0.08)" }
    },
    y: {
      ticks: { color: "#b7c4d6" },
      grid: { display: false }
    }
  };
}

function contarPor(lista, coluna) {
  return lista.reduce((acc, item) => {
    const valor = item[coluna] || "Não informado";
    acc[valor] = (acc[valor] || 0) + 1;
    return acc;
  }, {});
}

function ordenarLabels(labels, ordemPreferencial) {
  return labels.sort((a, b) => {
    const ia = ordemPreferencial.indexOf(a);
    const ib = ordemPreferencial.indexOf(b);

    if (ia === -1 && ib === -1) return a.localeCompare(b, "pt-BR");
    if (ia === -1) return 1;
    if (ib === -1) return -1;

    return ia - ib;
  });
}

function isConcluido(item) {
  return normalizar(item[COL.status]) === "concluido";
}

function isExecutar(item) {
  return normalizar(item[COL.classificacaoEscopo]) === "executar";
}

function corEscopo(label) {
  const valor = normalizar(label);

  if (valor === "executar") return CORES.blue;
  if (valor === "fora escopo") return CORES.purple;
  if (valor === "aguardando definicao") return CORES.yellow;

  return CORES.gray;
}

function corStatus(label) {
  const valor = normalizar(label);

  if (valor === "concluido") return CORES.green;
  if (valor === "em andamento") return CORES.blue;
  if (valor === "nao iniciado") return CORES.gray;

  return CORES.yellow;
}

function criarBadgeStatus(status) {
  const valor = normalizar(status);

  if (valor === "concluido") return `<span class="badge badge-success">${escapeHTML(status)}</span>`;
  if (valor === "em andamento") return `<span class="badge badge-primary">${escapeHTML(status)}</span>`;
  if (valor === "nao iniciado") return `<span class="badge badge-neutral">${escapeHTML(status)}</span>`;

  return `<span class="badge badge-neutral">${escapeHTML(status || "Não informado")}</span>`;
}

function criarBadgeEscopo(escopo) {
  const valor = normalizar(escopo);

  if (valor === "executar") return `<span class="badge badge-primary">${escapeHTML(escopo)}</span>`;
  if (valor === "fora escopo") return `<span class="badge badge-scope">${escapeHTML(escopo)}</span>`;
  if (valor === "aguardando definicao") return `<span class="badge badge-warning">${escapeHTML(escopo)}</span>`;

  return `<span class="badge badge-neutral">${escapeHTML(escopo || "Não informado")}</span>`;
}

function criarBadgeExecutivo(statusExec) {
  const valor = normalizar(statusExec);

  if (valor === "ok") return `<span class="badge badge-success">OK</span>`;
  if (valor === "monitoramento") return `<span class="badge badge-primary">MONITORAMENTO</span>`;
  if (valor === "atencao") return `<span class="badge badge-warning">ATENÇÃO</span>`;

  return `<span class="badge badge-neutral">${escapeHTML(statusExec || "Não informado")}</span>`;
}

function chaveDataTermino(valor) {
  const data = converterData(valor);

  if (!data) return "Sem planejamento";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

function formatarDataTabela(valor) {
  const data = converterData(valor);

  if (!data) return "Sem planejamento";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function converterData(valor) {
  if (!valor) return null;

  const texto = String(valor).trim();

  if (!texto || normalizar(texto) === "nan") return null;

  if (texto.includes("/")) {
    const partes = texto.split("/").map(Number);

    if (partes.length !== 3) return null;

    let mes;
    let dia;
    let ano;

    if (partes[0] > 12) {
      dia = partes[0];
      mes = partes[1] - 1;
      ano = partes[2];
    } else {
      mes = partes[0] - 1;
      dia = partes[1];
      ano = partes[2];
    }

    const data = new Date(ano, mes, dia);
    return isNaN(data) ? null : data;
  }

  if (texto.includes("-")) {
    const data = new Date(texto);
    return isNaN(data) ? null : data;
  }

  return null;
}

function converterDataParaOrdenacao(label) {
  const partes = label.split("/").map(Number);
  if (partes.length !== 2) return 99999999;

  const dia = partes[0];
  const mes = partes[1] - 1;

  return new Date(2026, mes, dia).getTime();
}

function escapeHTML(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
