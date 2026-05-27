const { openDb, run, all, get } = require('./src/database/connection');

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
  const db = openDb();

  // 1. Upsert vehicles with proper data
  for (const v of PLACAS) {
    const exists = await get(db, 'SELECT placa FROM veiculos WHERE placa = ?', [v.placa]);
    if (exists) {
      await run(db,
        `UPDATE veiculos SET tipo=?, fipe_name_marca=?, fipe_modelo=?, fipe_name_ano=?, cor=?, combustivel=? WHERE placa=?`,
        [v.tipo, v.marca, v.modelo, v.ano, v.cor, v.combustivel, v.placa]
      );
    } else {
      await run(db,
        `INSERT INTO veiculos (placa, tipo, fipe_name_marca, fipe_modelo, fipe_name_ano, cor, combustivel, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [v.placa, v.tipo, v.marca, v.modelo, v.ano, v.cor, v.combustivel]
      );
    }
  }

  const veiculos = await all(db, 'SELECT placa FROM veiculos');
  const placas = veiculos.map(v => v.placa);
  console.log(`${placas.length} veículos prontos`);

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-05-27');

  // delete old seed data to avoid duplicates if re-run
  for (const placa of placas) {
    await run(db, `DELETE FROM manutencoes WHERE veiculo_id = ?`, [placa]);
    await run(db, `DELETE FROM multas WHERE veiculo_id = ?`, [placa]);
    await run(db, `DELETE FROM abastecimentos WHERE veiculo_id = ?`, [placa]);
    await run(db, `DELETE FROM pagamentos_seguro WHERE veiculo_id = ?`, [placa]);
    await run(db, `DELETE FROM pagamento_documentos WHERE veiculo_id = ?`, [placa]);
  }

  // 2. Manutencoes
  for (const placa of placas) {
    const count = rand(3, 8);
    for (let i = 0; i < count; i++) {
      const data = randDate(startDate, endDate);
      const valor = randFloat(150, 3500);
      const descricao = LOREM[rand(0, LOREM.length - 1)];
      const km = rand(10000, 80000);
      const classificacao = Math.random() > 0.3 ? 'preventiva' : 'corretiva';
      await run(db,
        `INSERT INTO manutencoes (data, data_s, valor, descricao, km, classificacao, veiculo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data, data, valor, descricao, km, classificacao, placa]
      );
    }
  }
  console.log('Manutenções inseridas');

  // 3. Multas
  for (const placa of placas) {
    const count = rand(0, 3);
    for (let i = 0; i < count; i++) {
      const dataOcorrencia = randDate(startDate, endDate);
      const ocorrDate = new Date(dataOcorrencia);
      const vencDate = new Date(ocorrDate.getTime() + rand(15, 45) * 86400000);
      const dataVencimento = vencDate.toISOString().split('T')[0];
      const local = ['Av. Paulista', 'BR-101', 'Rodovia dos Bandeirantes', 'Centro', 'Marginal Tietê', 'Av. Brasil'][rand(0, 5)];
      const valor = randFloat(85, 800);
      await run(db,
        `INSERT INTO multas (data_ocorrencia, data_ocorrencia_s, data_vencimento, valor, local_ocorrencia, pagamento_realizado, veiculo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dataOcorrencia, dataOcorrencia, dataVencimento, valor, local, Math.random() > 0.2 ? 1 : 0, placa]
      );
    }
  }
  console.log('Multas inseridas');

  // 4. Abastecimentos
  for (const placa of placas) {
    const count = rand(8, 20);
    for (let i = 0; i < count; i++) {
      const data = randDate(startDate, endDate);
      const valor = randFloat(120, 350);
      const quantidade = randFloat(20, 55, 1);
      const km = rand(10000, 80000);
      const combustivel_id = rand(2, 4);
      await run(db,
        `INSERT INTO abastecimentos (data, data_s, valor, quantidade, km, combustivel_id, veiculo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data, data, valor, quantidade, km, combustivel_id, placa]
      );
    }
  }
  console.log('Abastecimentos inseridos');

  // 5. Pagamentos Seguro
  for (const placa of placas) {
    // check if there's a contrato_seguro for this vehicle (create one if not)
    let contrato = await get(db, 'SELECT id FROM contratos_seguro WHERE veiculo_id = ?', [placa]);
    if (!contrato) {
      const seguradora = await get(db, 'SELECT id FROM seguradoras LIMIT 1');
      const seguradoraId = seguradora ? seguradora.id : null;
      const result = await run(db,
        `INSERT INTO contratos_seguro (numero_apolice, data_inicial_contrato, data_final_contrato, ativo, veiculo_id, seguradora_id)
         VALUES (?, ?, ?, 1, ?, ?)`,
        ['AP-' + rand(10000, 99999), '2024-01-01', '2026-12-31', placa, seguradoraId]
      );
      contrato = { id: result.lastID };
    }
    const count = rand(2, 4);
    for (let i = 0; i < count; i++) {
      const dataPagamento = randDate(startDate, endDate);
      const valor = randFloat(800, 2500);
      await run(db,
        `INSERT INTO pagamentos_seguro (data_pagamento, valor, contrato_seguro_id, veiculo_id)
         VALUES (?, ?, ?, ?)`,
        [dataPagamento, valor, contrato.id, placa]
      );
    }
  }
  console.log('Pagamentos de seguro inseridos');

  // 6. Pagamento Documentos
  for (const placa of placas) {
    // IPVA + licenciamento por ano
    const anos = [2024, 2025, 2026];
    for (const ano of anos) {
      const dataVencimento = `${ano}-03-${rand(10, 31)}`;
      const dataPagamento = randDate(new Date(ano, 0, 1), new Date(ano, 2, 15));
      const valor = randFloat(400, 1800);
      await run(db,
        `INSERT INTO pagamento_documentos (data_pagamento, data_pagamento_s, data_vencimento, data_vencimento_s, valor, descricao, veiculo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dataPagamento, dataPagamento, dataVencimento, dataVencimento, valor, `IPVA ${ano}`, placa]
      );
    }
    // licenciamento
    for (const ano of anos) {
      const dataPagamento = randDate(new Date(ano, 0, 1), new Date(ano, 6, 30));
      const dataVencimento = `${ano}-06-30`;
      await run(db,
        `INSERT INTO pagamento_documentos (data_pagamento, data_pagamento_s, data_vencimento, data_vencimento_s, valor, descricao, veiculo_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dataPagamento, dataPagamento, dataVencimento, dataVencimento, randFloat(90, 150), `Licenciamento ${ano}`, placa]
      );
    }
  }
  console.log('Pagamentos de documentos inseridos');

  db.close();
  console.log('\nSeed concluído com sucesso!');
}

seed().catch(err => { console.error(err); process.exit(1); });
