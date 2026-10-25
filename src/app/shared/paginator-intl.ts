import {
  Injectable,
  inject
} from '@angular/core';

import {
  MatPaginatorIntl
} from '@angular/material/paginator';

import {
  TranslateService
} from '@ngx-translate/core';


// ============================================================
// TRANSLATED PAGINATOR LABELS
// ------------------------------------------------------------
// Replaces Angular Material's built-in English paginator text
// ("Items per page", "1 – 10 of 14", button tooltips) and
// updates it whenever the language changes.
// ============================================================

@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {

  private readonly translate =
    inject(TranslateService);


  constructor() {

    super();

    this.translate.onLangChange.subscribe(
      () => this.updateLabels()
    );

    this.updateLabels();
  }


  private updateLabels(): void {

    this.itemsPerPageLabel =
      this.translate.instant('common.paginator.itemsPerPage');

    this.nextPageLabel =
      this.translate.instant('common.paginator.nextPage');

    this.previousPageLabel =
      this.translate.instant('common.paginator.previousPage');

    this.firstPageLabel =
      this.translate.instant('common.paginator.firstPage');

    this.lastPageLabel =
      this.translate.instant('common.paginator.lastPage');


    // tells every paginator to re-render its labels
    this.changes.next();
  }


  override getRangeLabel = (
    page: number,
    pageSize: number,
    length: number
  ): string => {

    if (length === 0 || pageSize === 0) {

      return this.translate.instant(
        'common.paginator.range',
        { start: 0, end: 0, total: length }
      );

    }

    const start =
      page * pageSize + 1;

    const end =
      Math.min(start + pageSize - 1, length);

    return this.translate.instant(
      'common.paginator.range',
      { start, end, total: length }
    );
  };

}
