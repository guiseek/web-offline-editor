<?php
require_once __DIR__.'/../vendor/autoload.php';

use Silex\Application;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

$app = new Application();

// Registrando serviços
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

// App
$app->get('/', function () use ($app) {
	return $app['twig']->render('index.html', []);
});

// Arquivo da nota
$filename = __DIR__.'/notes/note.txt';

// Obtem nota
$app->get('/note', function () use ($app, $filename) {
    $note = file_get_contents($filename);

    $lastmodfile = filemtime($filename);
    $lastmodified = date("M d Y H:i:s", $lastmodfile);

    $headers = [
    	'Content-Type' => 'text/plain',
    	'Last-Modified' => $lastmodified
    ];

    return new Response($note, 200, $headers);
});

// Altera nota
$app->put('/note', function (Request $request) use ($app, $filename) {
	$data = $request->getContent();

	file_put_contents($filename, $data);

    return new Response($data, 200, array('Content-Type' => 'text/plain'));
});

// Verifica arquivo da nota
$app->match('/note', function ($app, $filename) {
    if (!file_exists($filename)) {
        return $app->abort(404, 'Nota não foi encontrada.');
    }
})
->method('GET|PUT');

// Erros
$app->error(function (\Exception $e, $code) {
    switch ($code) {
        case 404:
            $message = 'A página requisitada não foi encontrada.';
            break;
        default:
            $message = 'Desculpe, mas algo de terrivelmente errado aconteceu.';
    }

    return new Response($message);
});

$app['debug'] = true;

$app->run();