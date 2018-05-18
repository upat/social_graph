// URLからデータの取得
var getvalues = get(); //get

// human_data.jsonを元にコンテンツの描画
$.when(
	// まとめてJSON読み込み
	// 1つでも失敗すると.done()を飛ばして.fail()が実行される
	$.getJSON("/json/human_data.json"),
	$.getJSON("/json/nodes.json"),
	$.getJSON("/json/objects.json"),
	$.getJSON("/json/assist_data.json")
).done(function(data, nodes, objects, assist){
	data = JSON.parse(JSON.stringify(data[0]));
	nodes = JSON.parse(JSON.stringify(nodes[0]));
	objects = JSON.parse(JSON.stringify(objects[0]));
	assist = JSON.parse(JSON.stringify(assist[0]));

	var node = {}; // 個人パラメーターを格納する
	nodes.forEach(function(d){
		if(getvalues.id === d.id){
			node = JSON.parse(JSON.stringify(d));
		}
	});

	// タイトル部分(アイコン+名前+時間)
	var title_text = d3.select("body").append("div")
		.attr("class", "titletext");
	title_text.append("p").append("img")
		.attrs({
			src    : function(){
				return icon_url(node);
			},
			height : 120,
			width  : 120
		});
	title_text.append("p")
		.text(node.name + "さん" + "   " + getvalues.date.slice(0,2) + ':' + getvalues.date.slice(2,4) + "のデータ");

	// 遊んでいた場所
	var place_data = {1:"屋外", 2:"室内"};	// 場所名データ
	d3.select("body").append("p").attr("class", "subtext").text("= 遊んでいた場所 =");
	if(data[getvalues.date][getvalues.id]){
		var node_place = data[getvalues.date][getvalues.id].place;	// JSONの値
		d3.select("body").append("div")
			.styles({
				width        : "200px",
				height       : "250px",
				margin       : "5px",
				"text-align" : "center",
				"font-size"  : "24px",
				"background-image"    : "url(img/" + "day-" + node_place + ".png)",
				"background-size"     : "100%, auto",
				"background-repeat"   : "no-repeat",
				"background-position" : "bottom"
			})
			.attr("class", "subtext")
			.text(place_data[node_place] + "にいたかも");
	}else{
		d3.select("body").append("p").attr("class", "subtext").text("データがないよ");
	}

	// ソーシャルグラフの位置データ
	d3.select("body").append("p").attr("class", "subtext").text("= 近くにあった人・物 =");
	var near_node = d3.select("body")
		.append("div")
		.styles({
			width  : "630px",
			margin : "0 auto"
		});

	// 氏名・アイコンの順に表示.アイコンは背景として貼り付ける
	var ble_text = "unknown さん";
	if(data[getvalues.date][getvalues.id]){ // 条件式を分けないとコケる
		if(data[getvalues.date][getvalues.id].ble.length > 0){
			data[getvalues.date][getvalues.id].ble.forEach(function(ble_d){
				near_node.append("div")
					.styles({
						width        : "150px",
						height       : "170px",
						margin       : "5px",
						float        : "left",	// 親要素のwidthよりはみ出たら改行
						"text-align" : "center",
						"font-size"  : "24px",
						"background-image"    : function(){
							var url = "url(/img/unknown.gif)";
							nodes.forEach(function(node_d){
								if(node_d.name === ble_d){
									ble_text = node_d.name + "さん";
									url = "url(" + icon_url(node_d) + ")";
								}
							});
							objects.forEach(function(obj_d){
								if(obj_d.name === ble_d){
									ble_text = obj_d.name;
									url = "url(" + icon_url(obj_d) + ")";
								}
							});
							return url;
						},
						"background-size"     : "100%, auto",
						"background-repeat"   : "no-repeat",
						"background-position" : "bottom"
					})
					.text(ble_text);
			}, this);
			near_node.append("p").style("clear", "both");	// float:leftの解除
		}else{
			d3.select("body").append("p").attr("class", "subtext").text("データがないよ");
		}
	}else{
		d3.select("body").append("p").attr("class", "subtext").text("データがないよ");
	}

	// 運動データの円グラフ描画(予めassist_data.jsonに運動名、単位、色、目標値を設定する必要有)
	// テキスト
	d3.select("body").append("p").attr("class", "subtext").text("= 運動量 =");
	var cc_graph = d3.select("body") // "c" ir "c" le_graph
		.append("div")
		.styles({
			width  : "630px",
			margin : "0 auto"
		});
	// assist_data.jsonを元に描画していく
	var drawing_cc_graph = false; // 円グラフの有無判定
	Object.keys(assist.unit).forEach(function(key){
		// human_data.json内にassist_data.jsonで定義されている運動が存在する時、描画領域作成
		if(this[key]){ // key=運動名
			drawing_cc_graph = true;
			cc_graph.append("div")
			// 運動名のテキストと円グラフ
				.text("『" + assist.motion[key] + "』")
				.styles({
					width        : "200px",
					margin       : "5px",
					float        : "left",	// 親要素のwidthよりはみ出たら改行
					"text-align" : "center",
					"font-size"  : "20px"
				})
				// ここに円グラフが入る
				.append("div")
				.attrs({
					id : key
				});	
		}
		// circles.jsで円グラフの描画
		Circles.create({
			id: key,
			radius: 100,
			value: this[key],
			maxValue: assist.limit[key],
			width: 10,
			text: function(value){return value + assist.unit[key];},
			colors: assist.color[key].split(","),
			duration: 1500,
			wrpClass: 'circles-wrp',
			textClass: 'circles-text',
			valueStrokeClass: 'circles-valueStroke',
			maxValueStrokeClass: 'circles-maxValueStroke',
			styleWrapper: true,
			styleText: false
		});
	}, data[getvalues.date][getvalues.id]);
	if(!drawing_cc_graph){
		d3.select("body").append("p").attr("class", "subtext").text("データがないよ");
	}else{
		cc_graph.append("p").style("clear", "both");	// float:leftの解除
	}

	// セレクトボックスの配置
	d3.select("body")
		.append("select")
		.attr("id", "motion_list");
	var motion_list = d3.select("#motion_list");
	// セレクトボックスに運動名を配置
	Object.keys(assist.motion).forEach(function(key){
		motion_list.append('option')
			.text(assist.motion[key])
			.style("font-size", "24pt");
	}, this);

	// テキスト
	d3.select("body")
		.append("p")
		.text("のグラフを")
		.styles({
			display     : "inline-block",
			"font-size" : "24px"
		});

	// 表示ボタンの配置
	d3.select("body")
		.append("input")
		.attrs({
			id      : "exe",
			type    : "button",
			value   : "表示",
			onclick : "drawing_graph();"
		});

	// 折れ線グラフを描画する領域の作成
	d3.select("body")
		.append("div")
		.attrs({
			id     : "graph_frame"
		})
		.styles({
			width  : "800px",
			height : "500px"
		});

}).fail(function(){	
	// JSONファイルの読み込みに失敗した場合の処理
	console.log("ERROR: failed to load JSON file");
	$(function(){
		$.ajax({
			url:'/Devices.txt',
			success: function(data){
				var datas = data.split(/\r\n|\r|\n/);  // 改行コードで分割
				var data_value = []; //2次元配列で流す
				for (var i = 0; i < datas.length; i++){
					data_value.push(datas[i].split(','));
				}
				for (var i = 0; i < data_value.length; i++){
					if(data_value[i][0].indexOf(getvalues['id']) >= 0){ //同じIDであれば表示
						d3.select("body").append("p").text(data_value[i][1] + "さん").style("font-size","30px").append("img").attr({src:'img/'+ data_value[i][1] + '.gif',height:100, width:100});;
						d3.select("body").append("p").text("id：" + data_value[i][0]);
						d3.select("body").append("p").text("where：" + data_value[i][2]);
					}
				}
			},
			error: function(response){
				alert('ファイルがない');
			}
		});
	});
});

// JavaScriptでgetをする関数
function get(){
	var getUrl = window.location.href;
	var getUrlvalue = getUrl.split('?')[1].split('&'); // get
	var values = {};
	for(var i = 0; i < getUrlvalue.length; i++){
		var key = getUrlvalue[i].split("=")[0]; // key
		var value = getUrlvalue[i].split("=")[1]; // value
		values[key] = value; // 空想配列に追加
	}
	return values; // 空想配列を返す
}

// 画像ファイルURLの生成
function icon_url(obj){
	/* 
	 * ディレクトリ + 人物nodeのgender + 人物nodeのtype +
	 * 人物nodeのID末尾を3未満になるまで2で割ったもの + 拡張子
	 */
	var id_num = parseInt(obj.id.slice(-1), 16);
	while(id_num > 2){
		id_num = Math.floor(id_num / 2);
	}
	if(obj.gender){
		return '/img/' + obj.gender + obj.type + id_num + '.gif';
	}else{
		return '/img/' + obj.name + '.gif';
	}
}

// 折れ線グラフを(二重に)描画する関数
function drawing_graph(){
	// 描画前に既に描画済みの折れ線グラフを削除
	d3.select("#line_graph").remove();

	// JSON読み込み(読み込んだJSONを上手く関数外へ投げられないので描画の度に読み込み…)
	$.when(
		$.getJSON("/json/human_data.json"),
		$.getJSON("/json/assist_data.json"),
		$.getJSON("/json/date.json")
	).done(function(data, assist, date){
		data = JSON.parse(JSON.stringify(data[0]));
		assist = JSON.parse(JSON.stringify(assist[0]));
		date = JSON.parse(JSON.stringify(date[0]));

		// データが無い場合
		if(!data[getvalues.date][getvalues.id]){
			d3.selectAll("#graph_frame").append("p").attr("id", "line_graph").attr("class", "subtext").text("データがないよ");
			return;
		}

		// 時分のみのテキストを時刻データとして扱える型へ変換する
		var timeparse = d3.timeParse("%H:%M");
		// セレクトボックスで選択されているテキストの取得(運動名)
		var get_data = document.getElementById("motion_list").value;
		Object.keys(assist.motion).forEach(function(key){
			if(assist.motion[key] === get_data){
				get_data = key;
			}
		});

		var data_array = [];
		var line_color = assist.color[get_data].split(","); // 円グラフと同じ色データを使う
		// 折れ線グラフの描画に使うデータ配列 { date:時刻, value:計測値 } の作成
		date.forEach(function(d, i){
			var date_str = d.slice(0, 2) + ":" + d.slice(2, 4);
			if(!data[d][getvalues.id][get_data]){ // データがundefinedの場合
				if(i === 0){
					data_array.push({date:timeparse(date_str), value:0}); // 配列の先頭だった場合は0
				}else{
					data_array.push({date:timeparse(date_str), value:data_array[i-1].value}); // 2番目以降は1つ前の値を入れる
				}
			}else{
				data_array.push({date:timeparse(date_str), value:data[d][getvalues.id][get_data]});
			}
		});

		// 値が全て0のデータはデータが無いものとして扱う
		var sum_value = 0;
		data_array.forEach(function(d){
			sum_value += Math.abs(d.value); // マイナス値も考慮
		});
		if(sum_value === 0){
			d3.selectAll("#graph_frame").append("p").attr("id", "line_graph").attr("class", "subtext").text("データがないよ");
			return;
		}

		// XY軸のテキストを収めるためのマージン
		var margin = {top: 40, right: 40, bottom: 80, left: 40},
			width = 800 - margin.left - margin.right,
			height = 500 - margin.top - margin.bottom;
		// スケールの設定 x要素としてインデックス
		var xScale = d3.scaleTime()
			.domain([d3.min(data_array.map(function(d){ return d.date; })), d3.max(data_array.map(function(d){ return d.date; }))])
			.range([0, width]);
		// スケールの設定 y要素として配列の値
		var yScale = d3.scaleLinear()
			.domain([0, assist.limit[get_data]])
			.range([height, 0]);
		// X軸
		var xAxis = d3.axisBottom(xScale)
			.tickFormat(d3.timeFormat("%H:%M"));
		//.tickValues(walk_array.map(function(d){ return d.date; }));	// データが存在するラベルのみの場合用
		// Y軸
		var yAxis = d3.axisLeft(yScale);
		// 線グラフのラインオブジェクト
		var line = d3.line()
			.x(function(d) { return xScale(d.date); })
			.y(function(d) { return yScale(d.value); })
			.curve(d3.curveLinear);	// グラフ線の種類
		// SVGの追加
		var svg = d3.selectAll("#graph_frame").append("div").attr("id", "line_graph").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		// グループ要素にX軸を追加
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
		// グループ要素にY軸を追加
		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("x", 10)
			.attr("y", -10)
			.style("text-anchor", "end")
			.text("Value");
		// X軸のグリッド線を描画
		svg.append("g")			
			.attr("class", "grid")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis.tickSize(-height).tickFormat(""));
		// Y軸のグリッド線を描画
		svg.append("g")			
			.attr("class", "grid")
			.call(yAxis.tickSize(-width).tickFormat(""));
		// 実際のラインを追加(太さと色を変えて二重に描画)
		var paths = svg.append("path")
			.datum(data_array) // 配列をマッピング
			.attr("class", "sub_line")
			.attr("stroke", line_color[0])
			.attr("d", line);
		paths = svg.append("path")
			.datum(data_array) // 配列をマッピング
			.attr("class", "main_line")
			.attr("stroke", line_color[1])
			.attr("d", line);
	}).fail(function(){	
		console.log("ERROR: failed to load JSON file and drawing graph");
	});
}

