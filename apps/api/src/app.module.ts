import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';

// Domain modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TeamsModule } from './teams/teams.module';
import { DocumentsModule } from './documents/documents.module';
import { CollectionsModule } from './collections/collections.module';
import { TagsModule } from './tags/tags.module';
import { SearchModule } from './search/search.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { AutomationModule } from './automation/automation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { JobsModule } from './jobs/jobs.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // GraphQL (Code-First)
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),

    // Business Modules
    AuthModule,
    UsersModule,
    WorkspacesModule,
    TeamsModule,
    DocumentsModule,
    CollectionsModule,
    TagsModule,
    SearchModule,
    ChatModule,
    AiModule,
    AutomationModule,
    NotificationsModule,
    SettingsModule,
    JobsModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
