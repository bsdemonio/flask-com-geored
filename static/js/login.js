$( document ).ready(function() {
  $('#login').click(function(){
  	$.ajax({
        url: '/loginAuth',
        type: "post",
        data: {
          cellphone: $('#cellphone').val(),
          password: $('#password').val()
        }
      }).done(function(data) {
        console.log(data)
        var info =$.parseJSON(data)
        console.log(info)
        if(info[0].access == '1')
        {
        	window.location='/'	
        }
        else
        {
        	alert('Informacion invalida !')
        }

        
      });
  })
});