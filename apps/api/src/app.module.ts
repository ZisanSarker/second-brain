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
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';
import { FavoritesModule } from './favorites/favorites.module';
import { TrashModule } from './trash/trash.module';
import { RecentModule } from './recent/recent.module';
import { SearchModule } from './search/search.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { CollabModule } from './collab/collab.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';
import { AuditModule } from './audit/audit.module';
import { PresenceModule } from './presence/presence.module';
import { SharingModule } from './sharing/sharing.module';
import { AutomationModule } from './automation/automation.module';
import { SettingsModule } from './settings/settings.module';
import { JobsModule } from './jobs/jobs.module';
import { SharedModule } from './shared/shared.module';
import { AgentModule } from './agent/agent.module';

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
    FoldersModule,
    TagsModule,
    FavoritesModule,
    TrashModule,
    RecentModule,
    SearchModule,
    ChatModule,
    AiModule,
    CollabModule,
    CommentsModule,
    NotificationsModule,
    ActivityModule,
    AuditModule,
    PresenceModule,
    SharingModule,
    TeamsModule,
    AutomationModule,
    SettingsModule,
    JobsModule,
    SharedModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
