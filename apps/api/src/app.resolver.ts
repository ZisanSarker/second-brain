import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { description: 'Simple health check query' })
  helloWorld(): string {
    return 'Welcome to AI Second Brain API';
  }
}
