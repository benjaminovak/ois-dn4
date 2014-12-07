
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var id = [0, 0, 0];
var imena = ["Marko", "Manca", "Eva"];
var priimki = ["Zatlacen", "Zagozen", "Povozen"];
var datumRojstev = ["1964-03-10T08:08", "1987-03-04T12:12", "1994-19-01T11:11"];
var verjetnostDaSeZredi = [0.13, 0.81, 0.25];
var sessionId;

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
	sessionId = getSessionId();
	
	for(var i = 0; i < 3; i++){
		var ime = imena[i];
		var priimek = priimki[i];
		var datumRojstva = datumRojstev[i];
		var ehrId;
		var predloga = "<option value=\""+ ime + " "+ priimek  + " "+ datumRojstva +"\">" + ime + " "+ priimek + "</option>"
		$("#predlogaBolnika").html(predloga);
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        ehrId = data.ehrId;
		        id[i] = ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
		dodajMeritveVitalnihZnakov(ehrId, i, sessionId);
	}	
}

function dodajMeritveVitalnihZnakov(ehrId, i, sessionId) {
	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'> '" + ehrId + "'!");
	var datum = datumRojstev[i];
	datum = datum.split("-");
	var leto = datum[0];
	var dolzina = 2014 - leto;
	datum = datum.join("-");
	
	var visina = Math.floor((Math.random() * 50) + 150);
	var teza = Math.floor((Math.random() * 50) + 50);
	
	for(var j = 0; j < 1; j++){
		datum = datum.split("-");
		datum[0] = datum[0] + i;
		datum = datum.join("-");
		var datumInUra = datum; 
		
		var telesnaVisina = visina + Math.floor((Math.random() * 3));
		
		teza = teza +  Math.floor((verjetnostDaSeZredi[i])*(Math.random() * 5));
		teza = teza -  Math.floor((1 - verjetnostDaSeZredi[i])*(Math.random() * 3));
		var telesnaTeza = teza;
		
		var plus = Math.floor(Math.random() + 1);
		var telesnaTemperatura;
		if(plus === 1)	telesnaTemperatura = ((Math.random() * 4) + 37);
		else	telesnaTemperatura = (37 - (Math.random() * 3));
		
		plus = Math.floor(Math.random() + 1);
		var sistolicniKrvniTlak =  Math.floor(120 + (Math.pow((-1), plus) * Math.random() * 50));
		var diastolicniKrvniTlak = Math.floor(80 + (Math.pow((-1), plus) * Math.random() * 30));
		var nasicenostKrviSKisikom = Math.floor(100 - verjetnostDaSeZredi[i] * (Math.random() * 20));
		var merilec = 'Benjamin Novak';
	
		console.log("Do ajaxa");
		$.ajaxSetup({
		    headers: {	"Ehr-Session": sessionId	}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
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
		    "ehrId": ehrId,
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
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
		console.log("Vse vredu.");
	}
}



$(document).ready(function() {
	/*$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});*/
});