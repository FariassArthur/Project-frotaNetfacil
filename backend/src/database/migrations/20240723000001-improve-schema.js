module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper: convert integer (0/1) to boolean
    async function intToBoolean(tableName, columnName) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT DISTINCT "${columnName}" FROM "${tableName}" WHERE "${columnName}" IS NOT NULL`
      );
      for (const row of rows) {
        const val = row[columnName];
        if (val === 0 || val === 1) {
          await queryInterface.sequelize.query(
            `UPDATE "${tableName}" SET "${columnName}" = ${val === 1} WHERE "${columnName}" = ${val}`
          );
        }
      }
      await queryInterface.changeColumn(tableName, columnName, {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      });
    }

    // Helper: convert string date (YYYY-MM-DD or DD/MM/YYYY) to DATEONLY
    async function stringToDateonly(tableName, columnName) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT DISTINCT "${columnName}" FROM "${tableName}" WHERE "${columnName}" IS NOT NULL AND "${columnName}" != ''`
      );
      for (const row of rows) {
        const val = row[columnName];
        let isoDate = null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          isoDate = val;
        } else {
          const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (match) isoDate = `${match[3]}-${match[2]}-${match[1]}`;
        }
        if (isoDate && !isNaN(Date.parse(isoDate + 'T00:00:00Z'))) {
          await queryInterface.sequelize.query(
            `UPDATE "${tableName}" SET "${columnName}" = '${isoDate}' WHERE "${columnName}" = '${val.replace(/'/g, "''")}'`
          );
        }
      }
      await queryInterface.sequelize.query(
        `UPDATE "${tableName}" SET "${columnName}" = NULL WHERE "${columnName}" = ''`
      );
      await queryInterface.changeColumn(tableName, columnName, {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    // ========================================
    // 1. FIX TYPO: cnhs.aivo -> cnhs.ativo
    // ========================================
    await queryInterface.sequelize.query(
      `ALTER TABLE "cnhs" RENAME COLUMN "aivo" TO "ativo"`
    );

    // ========================================
    // 2. CONVERT INTEGER -> BOOLEAN
    // ========================================
    await intToBoolean('veiculos', 'ativo');
    await intToBoolean('cnhs', 'ativo');
    await intToBoolean('abastecimentos', 'tanque_cheio');
    await intToBoolean('multas', 'pagamento_realizado');
    await intToBoolean('contratos_seguro', 'ativo');
    await intToBoolean('config_manutencao_preventiva', 'ativo');
    await intToBoolean('usuarios', 'ativo');

    // ========================================
    // 3. CONVERT STRING -> DATEONLY
    // ========================================
    // veiculos
    await stringToDateonly('veiculos', 'data_aquisicao');
    await stringToDateonly('veiculos', 'data_vencimento_ipva');

    // cnhs
    await stringToDateonly('cnhs', 'nascimento');
    await stringToDateonly('cnhs', 'primeira_habilitacao');
    await stringToDateonly('cnhs', 'emissao');
    await stringToDateonly('cnhs', 'validade');

    // manutencoes
    await stringToDateonly('manutencoes', 'data');

    // multas
    await stringToDateonly('multas', 'data_ocorrencia');
    await stringToDateonly('multas', 'data_vencimento');
    await stringToDateonly('multas', 'data_pagamento');

    // contratos_seguro
    await stringToDateonly('contratos_seguro', 'data_inicial_contrato');
    await stringToDateonly('contratos_seguro', 'data_final_contrato');

    // pagamentos_seguro
    await stringToDateonly('pagamentos_seguro', 'data_pagamento');

    // pagamento_documentos
    await stringToDateonly('pagamento_documentos', 'data_pagamento');
    await stringToDateonly('pagamento_documentos', 'data_vencimento');

    // higienizacao
    await stringToDateonly('higienizacao', 'data');

    // abastecimentos
    await stringToDateonly('abastecimentos', 'data');

    // viagens
    await stringToDateonly('viagens', 'data_saida');
    await stringToDateonly('viagens', 'data_retorno');

    // config_manutencao_preventiva
    await stringToDateonly('config_manutencao_preventiva', 'data_proxima');

    // vistorias
    await stringToDateonly('vistorias', 'data');

    // pneus
    await stringToDateonly('pneus', 'data_instalacao');
    await stringToDateonly('pneus', 'data_retirada');

    // ordens_servico
    await stringToDateonly('ordens_servico', 'data_abertura');
    await stringToDateonly('ordens_servico', 'data_conclusao');

    // ========================================
    // 4. CONVERT logs_auditoria.created_at -> TIMESTAMP
    // ========================================
    const [logRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "created_at" FROM "logs_auditoria" WHERE "created_at" IS NOT NULL AND "created_at" != ''`
    );
    for (const row of logRows) {
      const val = row.created_at;
      let isoDate = null;
      if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        isoDate = val;
      } else {
        const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) isoDate = `${match[3]}-${match[2]}-${match[1]}` + val.slice(10);
      }
      if (isoDate) {
        await queryInterface.sequelize.query(
          `UPDATE "logs_auditoria" SET "created_at" = '${isoDate}' WHERE "created_at" = '${val.replace(/'/g, "''")}'`
        );
      }
    }
    await queryInterface.changeColumn('logs_auditoria', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // ========================================
    // 5. CONVERT ordens_servico timestamps -> TIMESTAMP
    // ========================================
    await queryInterface.sequelize.query(
      `UPDATE "ordens_servico" SET "created_at" = NULL WHERE "created_at" = ''`
    );
    await queryInterface.changeColumn('ordens_servico', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE "ordens_servico" SET "updated_at" = NULL WHERE "updated_at" = ''`
    );
    await queryInterface.changeColumn('ordens_servico', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // ========================================
    // 6. CONVERT vistorias.itens -> JSONB
    // ========================================
    const [vistoriaRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "itens" FROM "vistorias" WHERE "itens" IS NOT NULL AND "itens" != ''`
    );
    for (const row of vistoriaRows) {
      try {
        const parsed = JSON.parse(row.itens);
        await queryInterface.sequelize.query(
          `UPDATE "vistorias" SET "itens" = '${JSON.stringify(parsed).replace(/'/g, "''")}' WHERE "itens" = '${row.itens.replace(/'/g, "''")}'`
        );
      } catch {
        await queryInterface.sequelize.query(
          `UPDATE "vistorias" SET "itens" = NULL WHERE "itens" = '${row.itens.replace(/'/g, "''")}'`
        );
      }
    }
    await queryInterface.changeColumn('vistorias', 'itens', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    // ========================================
    // 7. CONVERT usuarios.permissoes -> JSONB
    // ========================================
    const [userPermRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "permissoes" FROM "usuarios" WHERE "permissoes" IS NOT NULL AND "permissoes" != ''`
    );
    for (const row of userPermRows) {
      let jsonVal;
      if (row.permissoes === 'all') {
        jsonVal = { all: true };
      } else {
        try { jsonVal = JSON.parse(row.permissoes); } catch { jsonVal = { all: true }; }
      }
      await queryInterface.sequelize.query(
        `UPDATE "usuarios" SET "permissoes" = '${JSON.stringify(jsonVal).replace(/'/g, "''")}' WHERE "permissoes" = '${row.permissoes.replace(/'/g, "''")}'`
      );
    }
    await queryInterface.changeColumn('usuarios', 'permissoes', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: { all: true },
    });

    // ========================================
    // 8. CONVERT logs_auditoria dados -> JSONB
    // ========================================
    await queryInterface.sequelize.query(
      `UPDATE "logs_auditoria" SET "dados_antigos" = NULL WHERE "dados_antigos" = ''`
    );
    await queryInterface.changeColumn('logs_auditoria', 'dados_antigos', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `UPDATE "logs_auditoria" SET "dados_novos" = NULL WHERE "dados_novos" = ''`
    );
    await queryInterface.changeColumn('logs_auditoria', 'dados_novos', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    // ========================================
    // 9. CONVERT Mecanica.contatos -> JSONB
    // ========================================
    const [mecContRows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT "contatos" FROM "mecanicas" WHERE "contatos" IS NOT NULL AND "contatos" != ''`
    );
    for (const row of mecContRows) {
      try {
        const parsed = JSON.parse(row.contatos);
        await queryInterface.sequelize.query(
          `UPDATE "mecanicas" SET "contatos" = '${JSON.stringify(parsed).replace(/'/g, "''")}' WHERE "contatos" = '${row.contatos.replace(/'/g, "''")}'`
        );
      } catch {
        // Keep as string if not valid JSON
      }
    }
    await queryInterface.changeColumn('mecanicas', 'contatos', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    // ========================================
    // 10. ADD INDEXES for FKs and common queries
    // ========================================
    const indexes = [
      { table: 'veiculos', column: 'combustivel' },
      { table: 'veiculos', column: 'cidade_id' },
      { table: 'cnhs', column: 'veiculo_id' },
      { table: 'manutencoes', column: 'veiculo_id' },
      { table: 'manutencoes', column: 'mecanica_id' },
      { table: 'manutencoes', column: 'tipo_manutencao_id' },
      { table: 'multas', column: 'veiculo_id' },
      { table: 'multas', column: 'motorista_id' },
      { table: 'contratos_seguro', column: 'seguradora_id' },
      { table: 'contratos_seguro', column: 'veiculo_id' },
      { table: 'pagamentos_seguro', column: 'contrato_seguro_id' },
      { table: 'pagamentos_seguro', column: 'veiculo_id' },
      { table: 'pagamento_documentos', column: 'veiculo_id' },
      { table: 'higienizacao', column: 'veiculo_id' },
      { table: 'abastecimentos', column: 'veiculo_id' },
      { table: 'viagens', column: 'veiculo_id' },
      { table: 'viagens', column: 'motorista_id' },
      { table: 'config_manutencao_preventiva', column: 'veiculo_id' },
      { table: 'config_manutencao_preventiva', column: 'tipo_manutencao_id' },
      { table: 'vistorias', column: 'veiculo_id' },
      { table: 'pneus', column: 'veiculo_id' },
      { table: 'ordens_servico', column: 'veiculo_id' },
      { table: 'ordens_servico', column: 'mecanica_id' },
      { table: 'ordens_servico', column: 'criado_por' },
      { table: 'logs_auditoria', column: 'username' },
      { table: 'logs_auditoria', column: 'entidade' },
      { table: 'logs_auditoria', column: 'acao' },
    ];

    for (const { table, column } of indexes) {
      const indexName = `idx_${table}_${column}`;
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${table}" ("${column}")`
      );
    }

    // Text search indexes
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_veiculos_placa_upper" ON "veiculos" (UPPER("placa"))`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_veiculos_tipo" ON "veiculos" ("tipo")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_veiculos_ativo" ON "veiculos" ("ativo")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_usuarios_username" ON "usuarios" ("username")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_ordens_servico_status" ON "ordens_servico" ("status")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_pneus_status" ON "pneus" ("status")`
    );
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "idx_multas_pagamento" ON "multas" ("pagamento_realizado")`
    );

    // ========================================
    // 11. ADD missing allowNull constraints
    // ========================================
    await queryInterface.changeColumn('veiculos', 'placa', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    });
    await queryInterface.changeColumn('usuarios', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    await queryInterface.changeColumn('usuarios', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('logs_auditoria', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('logs_auditoria', 'acao', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('logs_auditoria', 'entidade', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert boolean -> integer
    async function booleanToInt(tableName, columnName) {
      await queryInterface.sequelize.query(
        `UPDATE "${tableName}" SET "${columnName}" = 1 WHERE "${columnName}" = true`
      );
      await queryInterface.sequelize.query(
        `UPDATE "${tableName}" SET "${columnName}" = 0 WHERE "${columnName}" = false`
      );
      await queryInterface.changeColumn(tableName, columnName, {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    await booleanToInt('veiculos', 'ativo');
    await booleanToInt('cnhs', 'ativo');
    await booleanToInt('abastecimentos', 'tanque_cheio');
    await booleanToInt('multas', 'pagamento_realizado');
    await booleanToInt('contratos_seguro', 'ativo');
    await booleanToInt('config_manutencao_preventiva', 'ativo');
    await booleanToInt('usuarios', 'ativo');

    await queryInterface.sequelize.query(
      `ALTER TABLE "cnhs" RENAME COLUMN "ativo" TO "aivo"`
    );

    // Revert date -> string
    const dateColumns = [
      ['veiculos', 'data_aquisicao'], ['veiculos', 'data_vencimento_ipva'],
      ['cnhs', 'nascimento'], ['cnhs', 'primeira_habilitacao'], ['cnhs', 'emissao'], ['cnhs', 'validade'],
      ['manutencoes', 'data'],
      ['multas', 'data_ocorrencia'], ['multas', 'data_vencimento'], ['multas', 'data_pagamento'],
      ['contratos_seguro', 'data_inicial_contrato'], ['contratos_seguro', 'data_final_contrato'],
      ['pagamentos_seguro', 'data_pagamento'],
      ['pagamento_documentos', 'data_pagamento'], ['pagamento_documentos', 'data_vencimento'],
      ['higienizacao', 'data'],
      ['abastecimentos', 'data'],
      ['viagens', 'data_saida'], ['viagens', 'data_retorno'],
      ['config_manutencao_preventiva', 'data_proxima'],
      ['vistorias', 'data'],
      ['pneus', 'data_instalacao'], ['pneus', 'data_retirada'],
      ['ordens_servico', 'data_abertura'], ['ordens_servico', 'data_conclusao'],
    ];
    for (const [table, col] of dateColumns) {
      await queryInterface.changeColumn(table, col, { type: Sequelize.STRING, allowNull: true });
    }

    await queryInterface.changeColumn('logs_auditoria', 'created_at', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('ordens_servico', 'created_at', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('ordens_servico', 'updated_at', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('vistorias', 'itens', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('usuarios', 'permissoes', { type: Sequelize.STRING, allowNull: true, defaultValue: 'all' });
    await queryInterface.changeColumn('logs_auditoria', 'dados_antigos', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('logs_auditoria', 'dados_novos', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.changeColumn('mecanicas', 'contatos', { type: Sequelize.STRING, allowNull: true });

    // Drop indexes
    await queryInterface.sequelize.query(`
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%' AND schemaname = 'public' LOOP
          EXECUTE 'DROP INDEX IF EXISTS "' || r.indexname || '"';
        END LOOP;
      END $$;
    `);
  },
};
