import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

export const staticDeploymentModule = () => {
  if (!process.env.API_CORS || process.env.API_CORS === '1') {
    return ServeStaticModule.forRoot({
      rootPath: undefined,
    });
  }
  /**
   * When there is a prod script, then the server has to deploy the application static. The path has to be changed for the docker compose setup
   */
  return ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'client'),
  });
};
