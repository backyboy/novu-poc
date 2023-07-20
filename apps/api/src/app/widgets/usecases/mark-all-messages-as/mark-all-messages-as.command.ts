import { IsOptional, IsDefined } from 'class-validator';
import { MarkMessagesAsEnum } from '@novu/shared';

import { EnvironmentWithSubscriber } from '../../../shared/commands/project.command';

export class MarkAllMessagesAsCommand extends EnvironmentWithSubscriber {
  @IsOptional()
  feedIds?: string[];

  @IsDefined()
  markAs: MarkMessagesAsEnum;
}
