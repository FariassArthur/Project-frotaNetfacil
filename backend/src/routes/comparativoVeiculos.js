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
        const [manutencao, combustivel, multas, seguro, higienizacao] = await Promise.all([
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM manutencoes WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total, COALESCE(SUM(quantidade), 0) as litros FROM abastecimentos WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM multas WHERE veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(ps.valor), 0) as total FROM pagamentos_seguro ps WHERE ps.veiculo_id = ?`, [placa]),
          all(`SELECT COALESCE(SUM(valor), 0) as total FROM higienizacao WHERE veiculo_id = ?`, [placa]),
        ]);

        const kmRows = await all(`SELECT km FROM veiculos WHERE placa = ?`, [placa]);
        const km = kmRows[0]?.km || 0;

        const consumoRows = await all(`
          SELECT a.km, a.quantidade FROM abastecimentos a
          WHERE a.veiculo_id = ? AND a.km IS NOT NULL AND a.quantidade > 0
          ORDER BY a.data DESC LIMIT 2
        `, [placa]);

        let kml = null;
        if (consumoRows.length >= 2) {
          const diff = consumoRows[0].km - consumoRows[1].km;
          if (diff > 0) kml = diff / consumoRows[0].quantidade;
        }

        return {
          manutencao: Number(manutencao[0]?.total || 0),
          combustivel: Number(combustivel[0]?.total || 0),
          litros: Number(combustivel[0]?.litros || 0),
          multas: Number(multas[0]?.total || 0),
          seguro: Number(seguro[0]?.total || 0),
          higienizacao: Number(higienizacao[0]?.total || 0),
          total: 0,
          km,
          km_l: kml ? Number(kml.toFixed(2)) : null,
        };
      };

      const c1 = await custo(placa1);
      const c2 = await custo(placa2);
      c1.total = c1.manutencao + c1.combustivel + c1.multas + c1.seguro + c1.higienizacao;
      c2.total = c2.manutencao + c2.combustivel + c2.multas + c2.seguro + c2.higienizacao;

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
