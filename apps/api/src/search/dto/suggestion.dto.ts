import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchSuggestionDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  type!: 'query' | 'document' | 'tag' | 'collection';

  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional()
  subtitle?: string;
}

export class SearchSuggestionsDto {
  @ApiProperty({ type: [SearchSuggestionDto] })
  suggestions!: SearchSuggestionDto[];
}
