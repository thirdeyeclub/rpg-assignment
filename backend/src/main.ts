import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3200);
  console.log(`Graphql Endpoint: http://localhost:${process.env.PORT ?? 3200}/graphql`);
}
bootstrap();
