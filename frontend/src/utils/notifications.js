export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function notifyOverdue(items) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  if (items.length === 1) {
    const item = items[0];
    new Notification('Conta vencida!', {
      body: `${item.tipo} - ${item.veiculo_id}: R$ ${(item.valor || 0).toFixed(2).replace('.', ',')} (${item.dias_atraso} dia(s) de atraso)`,
      icon: '/vite.svg',
    });
  } else {
    new Notification('Contas vencidas!', {
      body: `${items.length} conta(s) estão em atraso. Acesse o dashboard para ver detalhes.`,
      icon: '/vite.svg',
    });
  }
}
