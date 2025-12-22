// ... existing code ...

/**
 * POST /api/telegram/test-notification
 * Создать тестовое уведомление (для админов)
 */
router.post('/test-notification', async (req, res) => {
  try {
    const { telegramId } = z.object({
      telegramId: z.number().int().positive(),
    }).parse(req.body);

    // Проверяем существование telegram_users
    const telegramUser = await pool.query(
      'SELECT id FROM telegram_users WHERE telegram_id = $1',
      [telegramId]
    );

    if (telegramUser.rows.length === 0) {
      return res.status(404).json({ error: 'Telegram user not found' });
    }

    // Создаем тестовое уведомление
    await pool.query(
      `INSERT INTO telegram_notifications (telegram_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        telegramId,
        'new_task',
        '🧪 Тестовое уведомление',
        'Это тестовое уведомление для проверки системы. Если вы видите это сообщение, значит уведомления работают!',
        JSON.stringify({ test: true }),
      ]
    );

    res.json({ success: true, message: 'Test notification created' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error }, 'Create test notification error');
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

// ... existing code ...
