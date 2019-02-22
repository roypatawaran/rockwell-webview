
$(function(){
    var $cartQty = $('#cartQty');
     $.ajax({
			type: 'GET',
            url: '/cartQty',						
            success: function(qty){
    			$("#cartQty").text(qty);
    		}
        });
        $.ajax({
			type: 'GET',
            url: '/cartIds',						
            success: function(dets){
    			console.log(dets + "here");
    		}
        });
        
    $('.delCart').click(function(e){
            var y = e.target.id.slice(0,-7);
            console.log(y);
            var z = "/deleteFromCart";
            console.log(y)
            $.ajax({
				type: 'POST',
			    data: {id: y},
                url: z,						
                success: function(data) {
                    console.log(data.removedElement + "look here");
                    var tempString = "#cartRow_" + data.removedElement;
                    $(tempString).html('');
                    $.ajax({
						type: 'GET',
                        url: '/cartQty',						
                        success: function(qty){
                			$("#cartQty").text(qty);
                // 			window.location.reload();
                		}
                    });
                    
                }
            });
            
        });
        
        
    $('.addCart').click(function(e){
        e.preventDefault();
        console.log('link clicked');
        var x="#"+e.target.id + "_qty";
        var id = e.target.id;
        var pass = {
			product: id,
			qty: $(x).val()
		};
		var p = id;
		var qty = $(x).val();
		console.log(pass);
		$.ajax({
			type: 'POST',
			data: {product: p, qty: qty},
            url: '/addToCart2',						
            success: function(data) {
                // updateCartElements(data.picture, data.name, data.quantity, data.price, data.id);
                console.log("done");
                // console.log(data.prodId + "look at this one");
                // updateCartElements(data.picture, data.)
                
                $.ajax({
					type: 'GET',
                    url: '/cartQty',						
                    success: function(qty){
                        $("#cartQty").html('');
                        $("#cartQty").append(qty);
                        window.location.reload();
            // 			$("#cartQty").text(qty);
            		}
                });
            }
        });

    });
    
    function updateCartElements (img, name, qty, price, id){
        var imgName= "picture_" + id;
        var nameName = "name_" + id;
        var qtyName = "qty_" + id;
        var priceName = "price_" + id;
        var totalName = "total_" + id;
        
        $(imgName).html('');
        $(imgName).append("<img alt='product description' src='<%=karts.picture%>'>");
        // $(imgName).text(img);
        
        
        // <img alt="product description" src="<%=karts.picture%>">
        
        
        // $datalist.append("<option value='" + elem.custName +  "''>" + elem._id + "</option>")
        
        
        
        $(nameName).html('');
        $(nameName).text(name);
        
        $(qtyName).html('');
        $(qtyName).append("<input class='text-center form-control' type='text' value='<%=karts.quantity%>'>")
        
        
        
        // <input class="text-center form-control" type="text" value="<%=karts.quantity %>">
        
        $(priceName).html('');
        $(priceName).text(price);
        
        var x = parseInt(qty)*parseInt(price);
        x = x.toString();
        
        $(totalName).html('');
        $(totalName).text(x);
    }
});