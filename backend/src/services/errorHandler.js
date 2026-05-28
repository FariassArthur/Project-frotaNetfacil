function sanitizeError(err) {
  if (process.env.NODE_ENV === 'production') {
    return 'Erro interno do servidor';
  }

  const msg = String(err?.message || err || 'Erro interno');
  if (msg.includes('duplicate key') || msg.includes('violates unique constraint')) {
    return 'Registro duplicado';
  }
  if (msg.includes('violates foreign key constraint')) {
    return 'Registro vinculado a outros dados';
  }
  if (msg.includes('stack') || msg.includes('at ') || msg.includes('node:')) {
    return 'Erro interno do servidor';
  }
  if (msg.includes('Tipo de arquivo não permitido')) {
    return msg;
  }
  return msg;
}

function handleError(res, err, logPrefix) {
  console.error(logPrefix || '[ERROR]', err?.message || err);
  res.status(500).json({ error: sanitizeError(err) });
}

module.exports = { sanitizeError, handleError };
