import pino from 'pino';

// Создаем логгер с настройками для production и development
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Метрики производительности
interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private readonly maxMetrics = 1000;

  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    // Ограничиваем размер массива
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getMetricStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const filtered = this.metrics.filter((m) => m.name === name);
    if (filtered.length === 0) return null;

    const values = filtered.map((m) => m.value);
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const metrics = new MetricsCollector();

// Middleware для логирования HTTP запросов
export function logRequest(req: any, res: any, responseTime: number) {
  const logData: any = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection.remoteAddress,
  };

  if (req.userId) {
    logData.userId = req.userId;
  }

  if (res.statusCode >= 400) {
    logger.warn(logData, 'HTTP Request');
  } else {
    logger.info(logData, 'HTTP Request');
  }

  // Записываем метрику
  metrics.record('http_request_duration', responseTime, {
    method: req.method,
    status: res.statusCode.toString(),
    route: req.route?.path || req.url,
  });
}

