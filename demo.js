
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var id = [0, 0, 0];
var imena = ["Marko", "Manca", "Eva"];
var gender = ["MALE", "FEMALE", "FEMALE"];
var priimki = ["Zatlacen", "Zagozen", "Povozen"];
var datumRojstev = ["1964-03-10T08:08", "1987-03-04T12:12", "1994-12-01T11:11"];
var verjetnostDaSeZredi = [0.13, 0.81, 0.25];

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
        "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function generator() {
	kreirajEHRzaBolnika(0);
	kreirajEHRzaBolnika(1);
	kreirajEHRzaBolnika(2);
}

function kreirajEHRzaBolnika(i) {
	var sessionId = getSessionId();

	var ime = imena[i];
	var priimek = priimki[i];
	var datumRojstva = datumRojstev[i];
	var spol = gender[i];

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
	
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        id[i] = ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            gender: spol,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    var predloga = "<option class=\"predloga\" value=\""+ id[i] +"\">" + ime + " "+ priimek + "</option>"
							console.log(predloga);
							$("#predlogaBolnika").append(predloga);
							dodajMeritveVitalnihZnakov(i);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}

function dodajMeritveVitalnihZnakov(i) {
	console.log("EhrId: " + id[i]);
	console.log("Ni ehrja! i = ", i);
	if ( id[i] !== 0){
		
		var datum = datumRojstev[i];
		datum = datum.split("-");
		var leto = datum[0];
		var dolzina = 2014 - leto;
		datum = datum.join("-");
		
		var visina = Math.floor((Math.random() * 50) + 150);
		var teza = Math.floor((Math.random() * 50) + 50);
		
		for(var j = 0; j < dolzina; j++){
			datum = datum.split("-");
			datum[0] = (parseInt(datum[0]) + i).toString();
			datum = datum.join("-");
			var datumInUra = datum; 
			
			var telesnaVisina = visina + Math.floor((Math.random() * 3));
			
			teza = teza +  Math.floor((verjetnostDaSeZredi[i])*(Math.random() * 5));
			teza = teza -  Math.floor((1 - verjetnostDaSeZredi[i])*(Math.random() * 3));
			var telesnaTeza = teza;
			
			var plus = Math.floor(Math.random());
			var telesnaTemperatura;
			if(plus === 1)	telesnaTemperatura = ((Math.random() * 4) + 37);
			else	telesnaTemperatura = (37 - (Math.random() * 3));
			
			plus = Math.floor(Math.random());
			var sistolicniKrvniTlak =  Math.floor(120 + (Math.pow((-1), plus) * Math.random() * 50));
			var diastolicniKrvniTlak = Math.floor(80 + (Math.pow((-1), plus) * Math.random() * 20));
			var nasicenostKrviSKisikom = Math.floor(100 - verjetnostDaSeZredi[i] * (Math.random() * 20));
			var merilec = 'Benjamin Novak';
		
			console.log("Do ajaxa");
			var sessionId = getSessionId();
			$.ajaxSetup({
			    headers: {	"Ehr-Session": sessionId	}
			});
			var podatki = {
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": datumInUra,
			    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
			    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
			   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
			    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
			    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
			    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
			    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
			};
			console.log(podatki);
			var parametriZahteve = {
			    "ehrId": id[i],
			    templateId: 'Vital Signs',
			    format: 'FLAT',
			    committer: merilec
			};
			$.ajax({
			    url: baseUrl + "/composition?" + $.param(parametriZahteve),
			    type: 'POST',
			    contentType: 'application/json',
			    data: JSON.stringify(podatki),
			    success: function (res) {
			    	console.log(res.meta.href);
			    	console.log("Vse vredu.");
			        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
			    },
			    error: function(err) {
			    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
					console.log(JSON.parse(err.responseText).userMessage);
			    }
			});
			
		}
	}
}

function prikaz(){
	sessionId = getSessionId();	

	var e = document.getElementById("predlogaBolnika");
	var ehrId = e.options[e.selectedIndex].value;
	console.log(ehrId);

	var myNode = document.getElementById("slika");
	myNode.innerHTML = '';
	myNode = document.getElementById("podatki");
	myNode.innerHTML = '';
	myNode = document.getElementById("masa");
	myNode.innerHTML = '';
	myNode = document.getElementById("temperatura");
	myNode.innerHTML = '';
	myNode = document.getElementById("nasicenost");
	myNode.innerHTML = '';
	myNode = document.getElementById("systolic");
	myNode.innerHTML = '';
	myNode = document.getElementById("diastolic");
	myNode.innerHTML = '';
	myNode = document.getElementById("visina");
	myNode.innerHTML = '';
	myNode = document.getElementById("index");
	myNode.innerHTML = '';

	var teza;
	var index;

	$.ajax({
	    url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (data) {
	        var party = data.party;
	        var predloga = "<img src=\"missing.png\" class=\"img-circle\">"
			$("#slika").append(predloga);
			var predloga = "<p class=\"p5\">" + party.firstNames + ' ' + party.lastNames + "</p>"
			$("#podatki").append(predloga);
			var predloga = "<p class=\"p3\"><b>Datum rojstva: </b>" + party.dateOfBirth + "</p>"
			$("#podatki").append(predloga);
			var spol = party.gender;
			if(spol === ("MALE")){
				spol = "Moški";
			}
			else	spol = "Ženski";
			var predloga = "<p class=\"p3\"><b>Spol: </b> " + spol + " </p>"
			$("#podatki").append(predloga);
			var predloga = "<p class=\"p3\"><b>Naslov: </b> - </p>"
			$("#podatki").append(predloga);
    }
	});
	$.ajax({
	    url: baseUrl + "/view/" + ehrId + "/weight",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        for (var i = 0; i < 1; i++) {
				var predloga = "<center><p class=\"p2\">Masa: "+ "</p>" +"<br>" + "<p class=\"p4\">" + res[i].weight +" "+ res[i].unit + "<br>"  + "</p></center>";
				$("#masa").append(predloga);
				teza = res[i].weight;
	            console.log(res[i].time + ': ' + res[i].weight + res[i].unit + "<br>");
	        }
	    }
	});
	$.ajax({
	    url: baseUrl + "/view/" + ehrId + "/body_temperature",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        for (var i = 0; i < 1; i++) {
	        	var temp = res[i].temperature.toString();
	        	temp = temp.substring(0, 4);
				var predloga = "<center><p class=\"p2\">Temperatura: "+ "</p>" +"<br>" + "<p class=\"p4\">" + temp +" "+ res[i].unit + "<br>"  + "</p></center>";
				$("#temperatura").append(predloga);
	            console.log(res[i].time + ': ' + res[i].body_temperature + res[i].unit + "<br>");
	        }
	    }
	});
	$.ajax({
	    url: baseUrl + "/view/" + ehrId + "/spO2",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        for (var i = 0; i < 1; i++) {
				var predloga = "<center><p class=\"p2\">Nasičenost krvi: "+ "</p>" +"<br>" + "<p class=\"p4\">" + res[i].spO2 +" %<br>"  + "</p></center>";
				$("#nasicenost").append(predloga);
	        }
	    }
	});
	$.ajax({
	    url: baseUrl + "/view/" + ehrId + "/blood_pressure",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        for (var i = 0; i < 1; i++) {
				var predloga = "<center><p class=\"p2\">Sistolični tlak: "+ "</p>" +"<br>" + "<p class=\"p4\">" + res[i].systolic +"<br>"  + "</p></center>";
				$("#systolic").append(predloga);
				var predloga = "<center><p class=\"p2\">Diastolični tlak: "+ "</p>" +"<br>" + "<p class=\"p4\">" + res[i].diastolic +"<br>"  + "</p></center>";
				$("#diastolic").append(predloga);
	        }
	    }
	});
	$.ajax({
	    url: baseUrl + "/view/" + ehrId + "/height",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	    	//console.log(res);
	        for (var i = 0; i < 1; i++) {
	            var predloga = "<img class=\"slikaVelikost\" src=\"sintaisokutei.GIF\">"
				$("#visina").append(predloga);
				var predloga = "<div class=\"besedilo\"> <p class=\"p2\">Velikost: "+ "</p>" +"<br>" + "<p class=\"p4\">" + res[i].height +" "+ res[i].unit + "<br>"  + "</p>" + "</div>";
				$("#visina").append(predloga);
				index = teza /(res[i].height / 100 * res[i].height / 100);
				var temp = index.toString();
	        	temp = temp.substring(0, 4);
				var predloga = "<center><p class=\"p2\">Index telesne teže: "+ "</p>" +"<br>" + "<p class=\"p4\">" + temp+"<br>"  + "</p></center>";
				$("#index").append(predloga);
	            console.log(res[i].time + ': ' + res[i].height + res[i].unit + "<br>" + index);
	        }
	    }
	});
}
//http://www.popolnapostava.com/indeks-telesne-mase/

$(document).ready(function() {

});