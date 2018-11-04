import { FancyListViewBase } from './fancy-list-view.common';

export declare class FancyListView extends FancyListViewBase {
    scrollToIndex(index: number): void;

    refresh(): void;

    getSelectedItems(): any[];
}
