const { all } = require('../database/connection');
const { handleError } = require('../services/errorHandler');

function registerComparativoVeiculosRoutes(app) {
  app.get('/api/veiculos/comparativo', async (req, res) => {
    try {
      const { placa1, placa2 } = req.query;
      if (!placa1 || !placa2) {
        return res.status(400).json({ error: 'Parâmetros placa1 e placa2 são obrigatórios' });
      }

      const veiculo1 = await all(`SELECT * FROM veiculos WHERE placa = ?`, [placa1]);
      const veiculo2 = await all(`SELECT * FROM veiculos WHERE placa = ?`, [placa2]);
      if (!veiculo1[0] || !veiculo2[0]) {
        return res.status(404).json({ error: 'Um dos veículos não foi encontrado' });
      }

      const custo = async (placa) => {
        const [manutencao, combustivel, multas, seguro, higienizacao, ordensServico] = await Promise.all([
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM manutencoes WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total, COALESCE(SUM(quantidade), 0) as litros, COUNT(*) as qtd_abast FROM abastecimentos WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM multas WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(ps.valor), 0) as total FROM pagamentos_seguro ps WHERE ps.veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM higienizacao WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(COALESCE(valor_mao_obra, 0) + COALESCE(valor_pecas, 0)), 0) as total FROM ordens_servico WHERE veiculo_id = ?`, [placa]),
        ]);

        const vRows = await all(`SELECT km FROM veiculos WHERE placa = ?`, [placa]);
        const kmAtual = vRows[0]?.km || 0;

        const kmRows = await all(`
          SELECT MIN(km) as km_min, MAX(km) as km_max FROM (
            SELECT km FROM abastecimentos WHERE veiculo_id = ? AND km IS NOT NULL AND km > 0
            UNION ALL
            SELECT km FROM manutencoes WHERE veiculo_id = ? AND km IS NOT NULL AND km > 0
          )
        `, [placa, placa]);

        const kmMin = kmRows[0]?.km_min || 0;
        const kmMax = kmRows[0]?.km_max || 0;
        const kmPercorrido = kmMax > kmMin ? kmMax - kmMin : 0;

        const consumoRows = await all(`
          SELECT a.km, a.quantidade FROM abastecimentos a
          WHERE a.veiculo_id = ? AND a.km IS NOT NULL AND a.quantidade > 0 AND a.km > 0
          ORDER BY a.data DESC LIMIT 5
        `, [placa]);

        let kml = null;
        if (consumoRows.length >= 2) {
          const last = consumoRows[0];
          const prev = consumoRows[consumoRows.length - 1];
          const diffKm = last.km - prev.km;
          const litrosEntre = consumoRows.slice(0, -1).reduce((s, r) => s + r.quantidade, 0);
          if (diffKm > 0 && litrosEntre > 0) {
            kml = diffKm / litrosEntre;
          }
        }

        const totalGeral =
          Number(manutencao[0]?.total || 0) +
          Number(combustivel[0]?.total || 0) +
          Number(multas[0]?.total || 0) +
          Number(seguro[0]?.total || 0) +
          Number(higienizacao[0]?.total || 0) +
          Number(ordensServico[0]?.total || 0);

        const custoPorKm = kmPercorrido > 0 ? totalGeral / kmPercorrido : null;

        return {
          manutencao: Number(manutencao[0]?.total || 0),
          combustivel: Number(combustivel[0]?.total || 0),
          litros: Number(combustivel[0]?.litros || 0),
          qtd_abast: Number(combustivel[0]?.qtd_abast || 0),
          multas: Number(multas[0]?.total || 0),
          seguro: Number(seguro[0]?.total || 0),
          higienizacao: Number(higienizacao[0]?.total || 0),
          ordens_servico: Number(ordensServico[0]?.total || 0),
          total: totalGeral,
          km: kmAtual,
          km_percorrido: kmPercorrido,
          km_l: kml ? Number(kml.toFixed(2)) : null,
          custo_por_km: custoPorKm ? Number(custoPorKm.toFixed(2)) : null,
        };
      };

      const c1 = await custo(placa1);
      const c2 = await custo(placa2);

      res.json({
        veiculo1: { ...veiculo1[0], custos: c1 },
        veiculo2: { ...veiculo2[0], custos: c2 },
      });
    } catch (error) {
      handleError(res, error, 'veiculos.comparativo');
    }
  });
}

module.exports = { registerComparativoVeiculosRoutes };
