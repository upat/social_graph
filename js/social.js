// 固定値変数のセット
// ソーシャルグラフ描画領域の頂点の数
var sides = 4;
// 人物・遊具nodeのアイコンの大きさ
var icon_size = 80;
// アイコンの大きさに基づいた各種調整に使う値
var node_margin = icon_size / 2;

// データ指定UIの配置
$.when(
	$.getJSON("/json/date.json")
).done(function(date){
	// セレクトボックスの配置
	var date_list = d3.select("body")
		.append("select")
		.attr("id", "date_list");

	// セレクトボックスに時間を配置
	date.forEach(function(d){
		date_list.append('option')
			.text(d.slice(0,2) + ':' + d.slice(2,4)) // 時刻に直す
			.style("font-size", "24pt");
	});

	// テキスト
	d3.select("body")
		.append("p")
		.text("のソーシャルグラフを")
		.styles({
			display     : "inline-block",
			"font-size" : "24px"
		});

	// 表示ボタンの配置
	d3.select("body")
		.append("input")
		.attrs({
			type    : "button",
			value   : "表示",
			onclick : "create_social();"
		});
}).fail(function(){	
	console.log("ERROR: failed to load date.json");
});

// maxからminまでの範囲で乱数生成
function randRange(max, min){
	var num = Math.floor(Math.random() * (max - min + 1) + min);
	return num;
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
	return '/img/' + obj.gender + obj.type + id_num + '.gif';
}

// 任意のidを指定した要素の検索
function search_id(){
	var find_id = false; // id:graph_baseを含むdiv要素が無ければfalseのままreturn
	var tag = document.getElementsByTagName("div");
	Array.from(tag).forEach(function(d){ // HTMLCollectionオブジェクトを強制Array化
		if(d.id === "graph_base"){
			find_id = true;
		} 
	});
	return find_id;
}

// 遊具node配置座標と遊具node付近へ人物nodeを配置する際の座標のデータを生成
/* 
 * objs     : 遊具nodeの数
 * objs_id  : 遊具nodeのidを格納した配列データ
 * aslength : 描画領域の1辺の長さ
 */
function create_cdn_data(objs, objs_id, aslength){
	// 遊具node設置座標、遊具のid、人物nodeを遊具付近へ設置する座標が入る
	var data = [];
	// 遊具nodeの個数カウントに使う一時的な変数
	var counter = 0;

	// 1辺あたりの遊具nodeの最大設置数
	var a_side_max_obj = Math.ceil(objs / sides);
	// 1辺あたりの遊具nodeの最小設置数
	var a_side_min_obj = Math.floor(objs / sides);
	// 1辺あたりの遊具nodeの最大設置間隔
	var a_side_interval = Math.ceil(aslength / (a_side_max_obj + 1));
	// 1辺あたりの遊具nodeの最小設置間隔
	if(a_side_min_obj < 1){
		var a_side_interval_min = a_side_interval;
	}else{
		var a_side_interval_min = Math.ceil(aslength / (a_side_min_obj + 1));
	}
	// 最大設置数となる辺の数
	if (objs < 4 || objs % 4 === 0){
		if(objs < 4){
			var max_obj_sides = objs;
		}else{
			var max_obj_sides = sides;
		}
	}else{
		var max_obj_sides = objs % 4;
	}

	// オブジェクト配列の生成
	for(var i=0; i<sides; i++){
		var ini_val = counter; // forループの初期値で使用

		// 1辺あたりに配置できる遊具node数の確認
		if(i < max_obj_sides){
			var interval_temp = a_side_interval;
			var loop = counter + a_side_max_obj;
		}else{
			var interval_temp = a_side_interval_min;
			var loop = counter + a_side_min_obj;
		}

		// 辺の位置に応じて座標を割り振る方向を変化させる(描画領域が四角形の前提)
		if(i < sides / 2){
			// 上辺・右辺は左->右、上->下
			var social_cor = 0;
			interval_temp = Math.abs(interval_temp);
		}else{
			// 底辺・左辺は右->左、下->上
			var social_cor = aslength;
			interval_temp = Math.abs(interval_temp) * -1;
		}

		for(var j=ini_val; j<loop; j++){
			social_cor += interval_temp;
			
			// 範囲外の値になった場合の例外処理
			if(social_cor > aslength || social_cor < 0){
				console.log("ERROR: object or a_side_length too many.");
				break;
			}

			// 各座標の値と遊具nodeのIDをセット(目視でnode_margin, icon_sizeによる微調整)
			if(i === 0){
				// 上辺
				data.push({
					x  : social_cor - node_margin,
					y  : 0,
					nx : social_cor - node_margin,
					ny : icon_size,
					id : objs_id[counter]
				});
			}else if(i === 1){
				// 右辺
				data.push({
					x  : aslength - icon_size,
					y  : social_cor - node_margin,
					nx : aslength - icon_size * 2.0,
					ny : social_cor - node_margin,
					id : objs_id[counter]
				});
			}else if(i === 2){
				// 底辺
				data.push({
					x  : social_cor - node_margin,
					y  : aslength - icon_size,
					nx : social_cor - node_margin,
					ny : aslength - icon_size * 2.0,
					id : objs_id[counter]
				});
			}else if(i === 3){
				// 左辺
				data.push({
					x  : 0,
					y  : social_cor - node_margin,
					nx : icon_size,
					ny : social_cor - node_margin,
					id : objs_id[counter]
				});
			}
			counter++;
		}
	}
	return data;
}

// ソーシャルグラフの作成
function create_social(){
	// ソーシャルグラフ用データ読み込み
	$.when(
		$.getJSON("/json/graph.json"),
		$.getJSON("/json/nodes.json"),
		$.getJSON("/json/objects.json")
	).done(function(graph, nodes, objects){
		graph = JSON.parse(JSON.stringify(graph[0]));
		nodes = JSON.parse(JSON.stringify(nodes[0]));
		objects = JSON.parse(JSON.stringify(objects[0]));

		d3.select("#social_graph").remove();	// 既に描画してあるソーシャルグラフを削除
		var date = document.getElementById("date_list").value.replace(':', ''); // セレクトボックスで指定した時刻の取得

		// 遊具の個数を取得
		var obj_count = objects.length;
		if(obj_count > 16){ // 遊具nodeは16個までしか正常に配置できない.
			obj_count = 16; // 描画は8つまでしか正常に動作しない(nodeの移動力が足りない)
		}

		// objects.jsonのID部分のみの配列を作る
		var objects_id = [];
		objects.forEach(function(d){
			objects_id.push(d.id);
		});

		// 1辺の長さ(obj_count = 9の時のみ例外)
		if(obj_count === 9){
			var a_side_length = (String(obj_count).length + 2) * 400;
		}else{
			var a_side_length = (String(obj_count).length + 1) * 400;
		}
		
		// 遊具node配置座標と遊具node付近へ人物nodeを配置する際の座標のデータを生成
		obj_cdn = JSON.parse(JSON.stringify(create_cdn_data(obj_count, objects_id, a_side_length)));
		
		// デバッグ用
		console.log("object : " + obj_cdn.length);
		obj_cdn.forEach(function(d){ console.log(d); });

		// 例外処理
		if(obj_cdn.length != obj_count){
			console.log("ERROR: obj_cdn[] is strange data");
			return;
		}

		// 遊具nodeの数・位置は変化しないため、一度描画した後は流用させる
		if(!search_id()){
			// ソーシャルグラフを描画する領域の作成
			var svg = d3.select("body")
				.append("div")
				.attr("id", "graph_base")
				.styles({
					width              : a_side_length + 'px', // pxまで含めないと反映されない
					height             : a_side_length + 'px',
					position           : "relative",
					"background-image" : "url(/img/woodplate.png)",
					"background-size"  : a_side_length + "px " + a_side_length + "px"
				});

			// 遊具nodeの配置
			var obj_img = svg;
			for(var i=0; i<obj_count; i++){
				obj_img
					.append("div") // おいでよdivdivの森
					.styles({
						width                 : a_side_length + "px",
						height                : a_side_length + "px",
						position              : "absolute",
						"background-image"    : "url(" + "/img/" + objects[i].name + ".gif)",
						"background-size"     : icon_size + "px" + "," + "auto",
						"background-position" : obj_cdn[i].x + "px" + " " + obj_cdn[i].y + "px",
						"background-repeat"   : "no-repeat"
					});
			}
		}else{
			svg = d3.select("#graph_base");
		}

		// 人物node等を描画するsvg領域の配置
		svg = svg.append("div")	// svg要素を一番上に重ねたいのでさらにdiv要素
			.attr("id", "social_graph")
			.styles({
				width                 : a_side_length + "px",
				height                : a_side_length + "px",
				position              : "absolute"
			})
			.append("svg")
			.attrs({
				width  : a_side_length,
				height : a_side_length
			});

		// forceSimulationによる人物nodeの挙動設定
		//var width = a_side_length / 2 - node_margin; // 想定位置よりズレた時の微調整
		//var height = a_side_length / 2 - node_margin;
		var width = a_side_length / 2;
		var height = a_side_length / 2;

		var simulation = d3.forceSimulation()
			.nodes(nodes)
			.on("tick", tick)
			.velocityDecay(0.20)									// node移動時の摩擦力.初期値0.40
			.force("center", d3.forceCenter(width, height))			// nodeの初期位置
			.force("charge", d3.forceManyBody()
				.strength(5))										// 万有引力のような効果の強さ
			.force("collition", d3.forceCollide(icon_size * 0.5))	// node間の反発力
			.force("link", d3.forceLink(graph[date].links)			// リンクするnodeのデータ取得
				.id(function(d){ return d.id; })
				.distance(icon_size * 1.5))							// node間のリンク線の長さ
			.force("x", d3.forceX().x(function(d){
				// 0からa_side_length/2の間でx座標の乱数を生成する.
				var x = randRange(a_side_length / 2 + 75, a_side_length / 2 - 75);

				// 遊具の近くにいたデータがあった場合は遊具node付近の座標を付与する.
				if(!graph[date].obj_links){
					return x;
				}else{
					graph[date].obj_links.forEach(function(val1, ind1, arr1){
						if(d.id === val1.node_id){
							obj_cdn.forEach(function(val2, ind2, arr2){
								if(val1.obj_id === val2.id){
									x = val2.nx;
								}
							})
						}
					});
				}
				return x;
			}).strength(0.05))
			.force("y", d3.forceY().y(function(d){
				// やっていることはxと同じ.
				var y = randRange(a_side_length / 2 + 75, a_side_length / 2 - 75);

				// こちらも同じ.
				if(!graph[date].obj_links){
					return y;
				}else{
					graph[date].obj_links.forEach(function(val1, ind1, arr1){
						if(d.id === val1.node_id){
							obj_cdn.forEach(function(val2, ind2, arr2){
								if(val1.obj_id === val2.id){
									y = val2.ny;
								}
							})
						}
					});
				}
				return y;
			}).strength(0.05));

		// リンク線の描画
		var link = svg.selectAll(".link")
			.data(graph[date].links) // ここで日付変更
			.enter()
			.append("line")
			.attrs({
				class          : "link",
				stroke         : "#696969",
				"stroke-width" : 1.5
			});

		// 人物nodeの描画
		var node = svg.selectAll(".node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node");
		// リンクされていないnodeが場外へ旅立つのでマウスドラッグ廃止
		/* .call(d3.drag()
				.on("start", dragstarted)	// マウスドラッグ開始
				.on("drag", dragged)		// node移動中
				.on("end", dragended)		// マウスドラッグ終了
			); */

		// nodes.jsonから読み込んだ値を使って画像を加工、アイコンにする
		node.append("image")
			.attrs({
				"xlink:href": function(d){ return icon_url(d); }, // 画像ファイル呼び出し
				x			: node_margin * -1,	// nodeの位置を起点にしてしまうと画像が右下にずれるので修正
				y			: node_margin * -1,
				width		: icon_size,		// 画像の大きさ
				height		: icon_size
			})
			.on("click", function(d){			// nodeにリンクを貼る
				window.location.href = "/personal_data.html?"+ "date="+ date + '&' + "id=" + d.id;
			});

		// 氏名でnodeにラベルを付ける
		node.append("text")
			.style("font-size", "20px")	// 文字の大きさ
			.attrs({
				y : node_margin + 10,	// テキストの高さ微調整
				"text-anchor": "middle"	// テキストがnodeの中心にくる
			})
			.text(function(d) { return d.name; });

		/*
		// マウスドラッグ開始時の処理
		function dragstarted(d){
			if(!d3.event.active) simulation.alphaTarget(0.9).restart();
			d.fx = d.x;
			d.fy = d.y;
		}
		// node移動中の処理
		function dragged(d){
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}
		// マウスドラッグ終了時の処理
		function dragended(d){
			if(!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
		*/

		// forceSimulationで移動する各要素の座標処理
		function tick() {
			// リンク線の両端の座標
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			// node(アイコン)の座標
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}
	}).fail(function(){	
		console.log("ERROR: failed to load JSON file");
	});
}
