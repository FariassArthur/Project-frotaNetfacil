const { sequelize, authenticate } = require('./src/database/sequelize');
const models = require('./src/models');

const {
  Veiculo, Manutencao, Multa, Abastecimento, PagamentoSeguro,
  PagamentoDocumento, ContratoSeguro, Seguradora, Combustivel,
} = models;

const LOREM = [
  'Troca de óleo e filtros',
  'Revisão periódica completa',
  'Alinhamento e balanceamento',
  'Troca de pastilhas de freio',
  'Substituição de correia dentada',
  'Troca de pneus dianteiros',
  'Troca de pneus traseiros',
  'Troca de amortecedores',
  'Limpeza de bicos injetores',
  'Troca de fluido de freio',
  'Substituição da bateria',
  'Troca de velas e cabos',
  'Reparo no ar condicionado',
  'Troca do radiador',
  'Substituição da embreagem',
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

const PLACAS = [
  { placa: 'ABC1234', tipo: 'SUV', marca: 'Jeep', modelo: 'Compass', ano: '2022', cor: 'Prata', combustivel: 2 },
  { placa: 'DEF5678', tipo: 'Sedan', marca: 'Toyota', modelo: 'Corolla', ano: '2023', cor: 'Branco', combustivel: 2 },
  { placa: 'GHI9012', tipo: 'Hatch', marca: 'Volkswagen', modelo: 'Gol', ano: '2021', cor: 'Preto', combustivel: 2 },
  { placa: 'JKL3456', tipo: 'Pickup', marca: 'Ford', modelo: 'Ranger', ano: '2022', cor: 'Vermelho', combustivel: 8 },
  { placa: 'MNO7890', tipo: 'Sedan', marca: 'Honda', modelo: 'Civic', ano: '2023', cor: 'Azul', combustivel: 2 },
  { placa: 'PQRS123', tipo: 'SUV', marca: 'Chevrolet', modelo: 'Tracker', ano: '2022', cor: 'Cinza', combustivel: 2 },
];

async function seed() {
  await authenticate();

  for (const v of PLACAS) {
    const exists = await Veiculo.findByPk(v.placa);
    const data = {
      tipo: v.tipo,
      fipe_name_marca: v.marca,
      fipe_modelo: v.modelo,
      fipe_name_ano: v.ano,
      cor: v.cor,
      combustivel: v.combustivel,
      ativo: 1,
    };
    if (exists) {
      await Veiculo.update(data, { where: { placa: v.placa } });
    } else {
      await Veiculo.create({ placa: v.placa, ...data });
    }
  }

  const veiculos = await Veiculo.findAll({ attributes: ['placa'] });
  const placas = veiculos.map(v => v.placa);
  console.log(`${placas.length} veículos prontos`);

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-05-27');

  for (const placa of placas) {
    await Manutencao.destroy({ where: { veiculo_id: placa } });
    await Multa.destroy({ where: { veiculo_id: placa } });
    await Abastecimento.destroy({ where: { veiculo_id: placa } });
    await PagamentoSeguro.destroy({ where: { veiculo_id: placa } });
    await PagamentoDocumento.destroy({ where: { veiculo_id: placa } });
  }

  for (const placa of placas) {
    const count = rand(3, 8);
    for (let i = 0; i < count; i++) {
      const data = randDate(startDate, endDate);
      await Manutencao.create({
        data, data_s: data,
        valor: randFloat(150, 3500),
        descricao: LOREM[rand(0, LOREM.length - 1)],
        km: rand(10000, 80000),
        classificacao: Math.random() > 0.3 ? 'preventiva' : 'corretiva',
        veiculo_id: placa,
      });
    }
  }
  console.log('Manutenções inseridas');

  for (const placa of placas) {
    const count = rand(0, 3);
    for (let i = 0; i < count; i++) {
      const dataOcorrencia = randDate(startDate, endDate);
      const ocorrDate = new Date(dataOcorrencia);
      const vencDate = new Date(ocorrDate.getTime() + rand(15, 45) * 86400000);
      const dataVencimento = vencDate.toISOString().split('T')[0];
      const local = ['Av. Paulista', 'BR-101', 'Rodovia dos Bandeirantes', 'Centro', 'Marginal Tietê', 'Av. Brasil'][rand(0, 5)];
      await Multa.create({
        data_ocorrencia: dataOcorrencia,
        data_ocorrencia_s: dataOcorrencia,
        data_vencimento: dataVencimento,
        valor: randFloat(85, 800),
        local_ocorrencia: local,
        pagamento_realizado: Math.random() > 0.2 ? 1 : 0,
        veiculo_id: placa,
      });
    }
  }
  console.log('Multas inseridas');

  for (const placa of placas) {
    const count = rand(8, 20);
    for (let i = 0; i < count; i++) {
      const data = randDate(startDate, endDate);
      await Abastecimento.create({
        data, data_s: data,
        valor: randFloat(120, 350),
        quantidade: randFloat(20, 55, 1),
        km: rand(10000, 80000),
        combustivel_id: rand(2, 4),
        veiculo_id: placa,
      });
    }
  }
  console.log('Abastecimentos inseridos');

  for (const placa of placas) {
    let contrato = await ContratoSeguro.findOne({ where: { veiculo_id: placa } });
    if (!contrato) {
      const seguradora = await Seguradora.findOne();
      contrato = await ContratoSeguro.create({
        numero_apolice: 'AP-' + rand(10000, 99999),
        data_inicial_contrato: '2024-01-01',
        data_final_contrato: '2026-12-31',
        ativo: 1,
        veiculo_id: placa,
        seguradora_id: seguradora ? seguradora.id : null,
      });
    }
    const count = rand(2, 4);
    for (let i = 0; i < count; i++) {
      await PagamentoSeguro.create({
        data_pagamento: randDate(startDate, endDate),
        valor: randFloat(800, 2500),
        contrato_seguro_id: contrato.id,
        veiculo_id: placa,
      });
    }
  }
  console.log('Pagamentos de seguro inseridos');

  for (const placa of placas) {
    const anos = [2024, 2025, 2026];
    for (const ano of anos) {
      const dataVencimento = `${ano}-03-${rand(10, 31)}`;
      const dataPagamento = randDate(new Date(ano, 0, 1), new Date(ano, 2, 15));
      await PagamentoDocumento.create({
        data_pagamento: dataPagamento,
        data_pagamento_s: dataPagamento,
        data_vencimento: dataVencimento,
        data_vencimento_s: dataVencimento,
        valor: randFloat(400, 1800),
        descricao: `IPVA ${ano}`,
        veiculo_id: placa,
      });
    }
    for (const ano of anos) {
      const dataPagamento = randDate(new Date(ano, 0, 1), new Date(ano, 6, 30));
      await PagamentoDocumento.create({
        data_pagamento: dataPagamento,
        data_pagamento_s: dataPagamento,
        data_vencimento: `${ano}-06-30`,
        data_vencimento_s: `${ano}-06-30`,
        valor: randFloat(90, 150),
        descricao: `Licenciamento ${ano}`,
        veiculo_id: placa,
      });
    }
  }
  console.log('Pagamentos de documentos inseridos');

  console.log('\nSeed concluído com sucesso!');
}

seed().catch(err => { console.error(err); process.exit(1); });
