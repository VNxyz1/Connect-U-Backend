import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

const API_DEFAULT_PORT = 3000;
const API_DEFAULT_PREFIX = '/api/';

const SWAGGER_TITLE = 'ConnectU API';
const SWAGGER_DESCRIPTION = 'API used for ConnectU application';
const SWAGGER_PREFIX = '/docs';
const SWAGGER_REQUEST_BASE_PATH = '';

function createSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setBasePath(
      process.env.SWAGGER_REQUEST_BASE_PATH || SWAGGER_REQUEST_BASE_PATH,
    )
    .addBearerAuth(
      {
        description:
          '[just text field] Please enter token in following format: Bearer <JWT>',
        name: 'Authorization',
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PREFIX, app, documentFactory);
}

function enableCors(app: INestApplication) {
  app.enableCors({
    origin: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Accept',
      'Viewport-Width',
      'Width',
      'Downlink',
      'DPR',
      'Accept-Language',
      'Content-Language',
    ],
    credentials: true,
  });
}

function enableCorsForCapacitorApp(app: INestApplication) {
  app.enableCors({
    origin: ['capacitor://localhost', 'http://localhost'],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Origin',
      'Accept',
      'Viewport-Width',
      'Width',
      'Downlink',
      'DPR',
      'Accept-Language',
      'Content-Language',
    ],
    credentials: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(process.env.API_PREFIX || API_DEFAULT_PREFIX);

  if (!process.env.SWAGGER_ENABLE || process.env.SWAGGER_ENABLE === '1') {
    createSwagger(app);
  }

  if (JSON.parse(process.env.API_CORS ?? 'false')) {
    enableCors(app);
  } else {
    enableCorsForCapacitorApp(app);
  }

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.API_PORT || API_DEFAULT_PORT);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);

  const defaultExitCode = 1;
  process.exit(defaultExitCode);
});
