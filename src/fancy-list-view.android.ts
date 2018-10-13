import * as common from './fancy-list-view.common';
import {
  FancyListViewBase,
  ItemEventData,
  itemHeightProperty,
  ITEMLOADING,
  ITEMTAP,
  itemTemplatesProperty,
  itemWidthProperty,
  LayoutTypeOptions,
  layoutTypeProperty,
  Orientation,
  orientationProperty,
  spanCountProperty
} from './fancy-list-view.common';
import { KeyedTemplate, layout, View } from 'tns-core-modules/ui/core/view';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { ProxyViewContainer } from 'tns-core-modules/ui/proxy-view-container';
import { Observable } from 'tns-core-modules/data/observable/observable';
import { LayoutBase } from 'tns-core-modules/ui/layouts/layout-base';

global.moduleMerge(common, exports);
export class FancyRecyclerView extends android.support.v7.widget.RecyclerView {
  constructor(
    context: android.content.Context,
    private owner: WeakRef<FancyListView>
  ) {
    super(context);
    return global.__native(this);
  }

  public onLayout(
    changed: boolean,
    l: number,
    t: number,
    r: number,
    b: number
  ) {
    if (changed) {
      const owner = this.owner.get();
      owner.onLayout(l, t, r, b);
    }
    super.onLayout(changed, l, t, r, b);
  }
}

export class FancyListView extends FancyListViewBase {
  nativeViewProtected: android.support.v7.widget.RecyclerView;
  public _realizedItems = new Map<android.view.View, View>();
  _random: any;
  public _staggeredMap: Map<number, number>;
  private _androidViewId: number = -1;

  constructor() {
    super();
  }

  public createNativeView() {
    this._staggeredMap = new Map<number, number>();
    this._random = new java.util.Random();
    const fancyList = new FancyRecyclerView(this._context, new WeakRef(this));
    ensureFancyListViewAdapterClass();
    const adapter = new FancyListViewAdapterClass(new WeakRef(this));
    adapter.setHasStableIds(true);
    fancyList.setAdapter(adapter);
    (<any>fancyList).adapter = adapter;
    const lm = new android.support.v7.widget.LinearLayoutManager(this._context);
    lm.setOrientation(android.support.v7.widget.LinearLayoutManager.VERTICAL);
    fancyList.setLayoutManager(lm);
    return fancyList;
  }

  public initNativeView() {
    super.initNativeView();
    const nativeView = this.nativeViewProtected;
    const adapter = (<any>nativeView).adapter;
    adapter.owner = new WeakRef(this);
    nativeView.setAdapter(adapter);
    if (this.layoutType) {
      this.setLayoutType(this.layoutType);
    }

    if (this.spanCount) {
      this.setSpanCount(this.spanCount);
    }

    this.setOrientation(this.orientation);
    itemWidthProperty.coerce(this);
    itemHeightProperty.coerce(this);
  }

  public [orientationProperty.getDefault](): Orientation {
    const layoutManager = this.nativeViewProtected.getLayoutManager() as any;
    if (
      layoutManager.getOrientation() ===
      android.support.v7.widget.LinearLayoutManager.HORIZONTAL
    ) {
      return 'horizontal';
    }

    return 'vertical';
  }

  private setOrientation(value: Orientation) {
    const layoutManager = this.nativeView.getLayoutManager() as any;

    if (layoutManager instanceof android.support.v7.widget.GridLayoutManager) {
      if (value === 'horizontal') {
        layoutManager.setOrientation(
          android.support.v7.widget.GridLayoutManager.HORIZONTAL
        );
      } else {
        layoutManager.setOrientation(
          android.support.v7.widget.GridLayoutManager.VERTICAL
        );
      }
    } else if (
      layoutManager instanceof
      android.support.v7.widget.StaggeredGridLayoutManager
    ) {
      if (value === 'horizontal') {
        layoutManager.setOrientation(
          android.support.v7.widget.StaggeredGridLayoutManager.HORIZONTAL
        );
      } else {
        layoutManager.setOrientation(
          android.support.v7.widget.StaggeredGridLayoutManager.VERTICAL
        );
      }
    } else {
      if (value === 'horizontal') {
        layoutManager.setOrientation(
          android.support.v7.widget.LinearLayoutManager.HORIZONTAL
        );
      } else {
        layoutManager.setOrientation(
          android.support.v7.widget.LinearLayoutManager.VERTICAL
        );
      }
    }

    this.nativeViewProtected.setLayoutManager(layoutManager);
  }

  private getOrientation(value: Orientation, layoutManager: any) {
    if (layoutManager instanceof android.support.v7.widget.GridLayoutManager) {
      if (value === 'horizontal') {
        return android.support.v7.widget.GridLayoutManager.HORIZONTAL;
      } else {
        return android.support.v7.widget.GridLayoutManager.VERTICAL;
      }
    } else if (
      layoutManager instanceof
      android.support.v7.widget.StaggeredGridLayoutManager
    ) {
      if (value === 'horizontal') {
        return android.support.v7.widget.StaggeredGridLayoutManager.HORIZONTAL;
      } else {
        return android.support.v7.widget.StaggeredGridLayoutManager.VERTICAL;
      }
    } else {
      if (value === 'horizontal') {
        return android.support.v7.widget.LinearLayoutManager.HORIZONTAL;
      } else {
        return android.support.v7.widget.LinearLayoutManager.VERTICAL;
      }
    }
  }

  public [orientationProperty.setNative](value: Orientation) {
    this.setOrientation(value);
  }

  public disposeNativeView() {
    this.eachChildView(view => {
      if (view && view.parent) {
        view.parent._removeView(view);
      }
      return true;
    });
    const nativeView = this.nativeViewProtected;
    nativeView.setAdapter(null);
    // (<any>nativeView).itemClickListener.owner = null;
    (<any>nativeView).adapter.owner = null;
    this.clearRealizedCells();
    super.disposeNativeView();
  }

  public onLayout(left: number, top: number, right: number, bottom: number) {
    super.onLayout(left, top, right, bottom);
    this.refresh();
  }

  public refresh(): void {
    const nativeView = this.nativeViewProtected;
    if (!nativeView || !nativeView.getAdapter()) {
      return;
    }

    // clear bindingContext when it is not observable because otherwise bindings to items won't reevaluate
    this._realizedItems.forEach((view, nativeView) => {
      if (!(view.bindingContext instanceof Observable)) {
        view.bindingContext = null;
      }
    });
    this.setLayoutType(this.layoutType);
    this.setSpanCount(this.spanCount);
    nativeView.getAdapter().notifyDataSetChanged();
  }

  [itemTemplatesProperty.getDefault](): KeyedTemplate[] {
    return null;
  }

  [itemTemplatesProperty.setNative](value: KeyedTemplate[]) {
    this._itemTemplatesInternal = new Array<KeyedTemplate>(
      this._defaultTemplate
    );
    if (value) {
      this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
    }
    this.nativeViewProtected.setAdapter(
      new FancyListViewAdapterClass(new WeakRef(this))
    );
    this.refresh();
  }

  [spanCountProperty.setNative](spanCount: number) {
    this.setSpanCount(spanCount);
    this.refresh();
  }

  [layoutTypeProperty.setNative](type: string) {
    this.setLayoutType(type);
    this.refresh();
  }

  public eachChildView(callback: (child: View) => boolean): void {
    this._realizedItems.forEach((view, nativeView) => {
      if (view.parent instanceof FancyListView) {
        callback(view);
      } else {
        // in some cases (like item is unloaded from another place (like angular) view.parent becomes undefined)
        if (view.parent) {
          callback(<View>view.parent);
        }
      }
    });
  }

  private setSpanCount(count: number) {
    const nativeView = this.nativeViewProtected;
    if (nativeView && this._effectiveItemWidth && this._innerWidth) {
      const lm = nativeView.getLayoutManager();
      if (
        lm instanceof android.support.v7.widget.GridLayoutManager ||
        lm instanceof android.support.v7.widget.StaggeredGridLayoutManager
      ) {
        lm.setSpanCount(count);
      }
    }
  }

  private setLayoutType(type: string) {
    const nativeView = this.nativeViewProtected;
    if (nativeView) {
      switch (type) {
        case LayoutTypeOptions.GRID:
          const lmg = new android.support.v7.widget.GridLayoutManager(
            this._context,
            this.spanCount
          );
          lmg.setOrientation(this.getOrientation(this.orientation, lmg));
          nativeView.setLayoutManager(lmg);
          break;
        case LayoutTypeOptions.STAGGERED:
          const lms = new android.support.v7.widget.StaggeredGridLayoutManager(
            2,
            android.support.v7.widget.RecyclerView.VERTICAL
          );
          lms.setOrientation(this.getOrientation(this.orientation, lms));
          nativeView.setLayoutManager(lms);
          break;
        default:
          const lm = new android.support.v7.widget.LinearLayoutManager(
            this._context
          );
          lm.setOrientation(this.getOrientation(this.orientation, lm));
          nativeView.setLayoutManager(lm);
          break;
      }
    }
  }

  private clearRealizedCells(): void {
    // clear the cache
    this._realizedItems.forEach((view, nativeView) => {
      if (view.parent) {
        // This is to clear the StackLayout that is used to wrap non LayoutBase & ProxyViewContainer instances.
        if (!(view.parent instanceof FancyListView)) {
          this._removeView(view.parent);
        }
        view.parent._removeView(view);
      }
    });

    this._realizedItems.clear();
    this._staggeredMap.clear();
  }
}

let FancyListViewAdapterClass;

function ensureFancyListViewAdapterClass() {
  if (FancyListViewAdapterClass) {
    return;
  }

  class FancyListViewAdapter extends android.support.v7.widget.RecyclerView
    .Adapter {
    owner: WeakRef<FancyListView>;

    constructor(owner: WeakRef<FancyListView>) {
      super();
      this.owner = owner;
      return global.__native(this);
    }

    public onCreateViewHolder(
      parent: android.view.ViewGroup,
      viewType: number
    ) {
      const owner = this.owner ? this.owner.get() : null;
      if (!owner) {
        return null;
      }
      const template = owner._itemTemplatesInternal[viewType]; // owner._getItemTemplate(index);
      let view: View =
        template.createView() || owner._getDefaultItemContent(viewType);

      /*
      if (view instanceof View && !(view instanceof ProxyViewContainer)) {
        owner._addView(view);
      } else {
        let sp = new StackLayout();
        sp.addChild(view);
        owner._addView(sp);
      }
      */

      owner._addView(view);

      owner._realizedItems.set(view.nativeView, view);

      const holder = new FancyListViewHolder(
        new WeakRef(view),
        new WeakRef(owner)
      );
      return holder;
    }

    public onBindViewHolder(holder: FancyListViewHolder, index: number) {
      const owner = this.owner ? this.owner.get() : null;
      if (owner) {
        let args = <ItemEventData>{
          eventName: ITEMLOADING,
          object: owner,
          android: holder,
          ios: undefined,
          index,
          view: holder.view
        };

        owner.notify(args);

        if (owner.layoutType === LayoutTypeOptions.STAGGERED) {
          let random;
          const max = layout.toDeviceIndependentPixels(
            owner._effectiveItemHeight
          );
          const min =
            layout.toDeviceIndependentPixels(owner._effectiveItemHeight) *
            (1 / 3);
          if (min && max) {
            if (owner._staggeredMap && owner._staggeredMap.has(index)) {
              random = owner._staggeredMap.get(index);
            } else {
              random =
                (owner._random as java.util.Random).nextInt(max - min + min) +
                min;
              if (!owner._staggeredMap) {
                owner._staggeredMap = new Map<number, number>();
              }
              owner._staggeredMap.set(index, random);
            }
            holder.view.height = random;
          }
        } else {
          if (owner._itemHeight) {
            holder.view.height = layout.toDeviceIndependentPixels(
              owner._effectiveItemHeight
            );
          }

          if (owner._itemWidth) {
            holder.view.width = layout.toDeviceIndependentPixels(
              owner._effectiveItemWidth
            );
          }
        }

        owner._prepareItem(holder.view, index);
      }
    }

    public getItemId(i: number) {
      const owner = this.owner ? this.owner.get() : null;
      let id = i;
      if (owner && owner.items) {
        const item = owner.items[i];
        if (item) {
          id = owner.itemIdGenerator(item, i, owner.items);
        }
      }
      return long(id);
    }

    public getItemCount(): number {
      const owner = this.owner ? this.owner.get() : null;
      return owner && owner.items && owner.items.length
        ? owner.items.length
        : 0;
    }

    public getItemViewType(index: number) {
      const owner = this.owner ? this.owner.get() : null;
      if (owner) {
        let template = owner._getItemTemplate(index);
        let itemViewType = owner._itemTemplatesInternal.indexOf(template);
        return itemViewType;
      }
      return 0;
    }
  }

  FancyListViewAdapterClass = FancyListViewAdapter;
}

@Interfaces([android.view.View.OnClickListener])
class FancyListViewHolder
  extends android.support.v7.widget.RecyclerView.ViewHolder
  implements android.view.View.OnClickListener {
  constructor(
    private owner: WeakRef<View>,
    private list: WeakRef<FancyListView>
  ) {
    super(owner.get().nativeViewProtected);
    const that = global.__native(this);
    owner.get().nativeViewProtected.setOnClickListener(that);
    return that;
  }

  get view(): View {
    return this.owner ? this.owner.get() : null;
  }

  public onClick(v: android.view.View) {
    const listView = this.list.get();

    listView.notify<ItemEventData>({
      eventName: ITEMTAP,
      object: listView,
      index: this.getAdapterPosition(),
      view: this.view,
      android: v,
      ios: undefined
    });
  }
}
