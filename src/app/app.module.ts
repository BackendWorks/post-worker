import { Module } from '@nestjs/common';

import { CommonModule } from 'src/common/common.module';
import { IndexingModule } from 'src/modules/indexing/indexing.module';

@Module({
    imports: [CommonModule, IndexingModule],
})
export class AppModule {}
