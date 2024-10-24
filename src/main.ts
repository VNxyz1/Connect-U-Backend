import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * These are API defaults that can be changed using environment variables,
 * it is not required to change them (see the `.env.example` file)
 */
const API_DEFAULT_PORT = 3000;
const API_DEFAULT_PREFIX = '/api/';

/**
 * These are the Swagger documentation defaults
 */
const SWAGGER_TITLE = 'Passenger API';
const SWAGGER_DESCRIPTION = 'API used for passenger management';
const SWAGGER_PREFIX = '/docs';


function createSwagger(app: INestApplication) {

  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PREFIX, app, documentFactory);
}



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(process.env.API_PREFIX || API_DEFAULT_PREFIX);

  if (!process.env.SWAGGER_ENABLE || process.env.SWAGGER_ENABLE === '1') {
    createSwagger(app);
  }

  await app.listen(process.env.API_PORT || API_DEFAULT_PORT);
}


bootstrap().catch(err => {

  // eslint-disable-next-line no-console
  console.error(err);

  const defaultExitCode = 1;
  process.exit(defaultExitCode);
});
