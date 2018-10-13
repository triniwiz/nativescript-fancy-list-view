<template>
	<Page>
		<ActionBar title="Welcome to NativeScript-Vue!"/>
		<GridLayout rows="auto,auto,auto,*">
			<Button @tap="multi" text="Show Multi Template"/>
			<Button row="1" @tap="grid" text="Show Grid Layout"/>
			<Button row="2" @tap="stagger" text="Show Staggered Layout"/>
			<FancyListView row="3" orientation="horizontal" for="item of items" hideScrollBar="true">
				<v-template>
					<GridLayout rows="auto,*">
						<Label :text="item.title" class="t-20 text-center c-black" textWrap="true"/>
						<ImageCacheIt resize="300,300" stretch="fill" row="1" :imageUri="item.image"></ImageCacheIt>
					</GridLayout>
				</v-template>
			</FancyListView>
		</GridLayout>
	</Page>
</template>

<script>
	import routes from '../routes';
	import data from '../data';
	export default {
		data() {
			return {
				items: data.items
			}
		},
		methods: {
			multi: function (args) {
				this.$navigateTo(routes.multi);
			}, grid: function (args) {
				this.$navigateTo(routes.grid);
			}, stagger: function (args) {
				this.$navigateTo(routes.stagger);
			}
		}
	}
</script>

<style scoped>
	ActionBar {
		background-color: #53ba82;
		color: #ffffff;
	}

	.message {
		vertical-align: center;
		text-align: center;
		font-size: 20;
		color: #333333;
	}
</style>
