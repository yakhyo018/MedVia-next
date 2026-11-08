/** One passage Navi answered from; `url` is a page on the site when the source has one. */
export interface NaviSource {
	index: number;
	docId: string;
	title: string;
	heading: string;
	cited: boolean;
	url?: string | null;
}

export interface NaviAnswer {
	answer: string;
	refused: boolean;
	sources: NaviSource[];
	disclaimer: string;
}
