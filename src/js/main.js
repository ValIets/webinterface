import jQuery from 'jquery';

import config from './config';

(function($) {
    const socket = new WebSocket(
        `ws://${config.server.ip}:${config.server.port}`
    );

    const urlParams = new URLSearchParams(window.location.search);
    const $statusPage = $('#status-page');
    const $residentPage = $('#resident-page');

    if (urlParams.has('resident')) {
        handleResidentPage();
    } else {
        handleStatusPage();
    }

    function handleResidentPage() {
        $statusPage.hide();
        $residentPage.show();

        let resident = [];

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            resident = data.residents;
        };

        if (resident.length == 0) {
            resident = {
                id: "783223",
                name: "Bert Hendriks",
                location: "QPZ33.5",
                status: "BATTERY_LOW",
            };
        }

        let statusIcon = `<i class="far fa-circle fa-xs" style="color: limegreen;"></i>`;
        let statusHtml = `${statusIcon} In orde`;

        if (resident.status == 'BATTERY_LOW') {
            statusIcon = `<i class="fa fa-circle fa-xs" style="color:orange;"></i>`;
            statusHtml = `${statusIcon} Batterij laag`;
        } else if (resident.status == 'POSSIBLY_FALLEN') {
            statusIcon = `<i class="fa fa-circle fa-xs" style="color:red;"></i>`;
            statusHtml = `${statusIcon} Mogelijk gevallen`;
        }

        $('#resident-page__id').text(`#${resident.id}`);
        $('#resident-page__title').html(`${statusIcon} ${resident.name} (#${resident.id})`);
        $('#resident-page__name').text(resident.name);
        $('#resident-page__location').text(resident.location);
        $('#resident-page__status').html(statusHtml);
    };

    function handleStatusPage() {
        let residents = [];

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            residents = data.residents;

            setInterval(() => {
                socket.send('Ping!');
                console.log('Pinged to server.');
            }, 1000);
        };

        if (residents.length == 0) {
            residents = [
                {
                    id: "183312",
                    name: "Bert Hendriks",
                    location: "QPZ33.5",
                    status: "BATTERY_LOW",
                },
                {
                    id: "981231",
                    name: "Evert Klein",
                    location: "JKP42.1",
                    status: "OK",
                },
                {
                    id: "283943",
                    name: "Celine Pepers",
                    location: "DRJ21.2",
                    status: "OK",
                },
                {
                    id: "783223",
                    name: "Dirk de Haan",
                    location: "QPZ33.5",
                    status: "POSSIBLY_FALLEN",
                },
                {
                    id: "881202",
                    name: "Vanessa van Vliet",
                    location: "LF94.5",
                    status: "OK",
                },
            ];
        }

        const $residentsTableRows = $('#residents-table-rows');
        $residentsTableRows.empty();

        $.each(residents, function(i, resident) {
            const $tr = $('<tr>');
            $tr.append($('<td>').text(resident.id));
            $tr.append(
                $('<td>').html(
                    `<a href="?resident=${resident.id}">${resident.name}</a>`
                )
            );
            $tr.append($('<td>').text(resident.location));

            let statusHtml = `<i class="far fa-circle fa-xs" style="color: limegreen;"></i> In orde`;

            if (resident.status == 'BATTERY_LOW') {
                statusHtml = `<i class="fa fa-circle fa-xs" style="color:orange;"></i> Batterij laag`;
            } else if (resident.status == 'POSSIBLY_FALLEN') {
                statusHtml = `<i class="fa fa-circle fa-xs" style="color:red;"></i> Mogelijk gevallen`;
            }

            $tr.append($('<td>').html(statusHtml));
            $tr.append($('<td>'));

            $tr.appendTo($residentsTableRows);
        });
    };
})(jQuery);
