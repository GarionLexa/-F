using UnityEngine;
using Fusion;

public class TruckerController : NetworkBehaviour
{
    [Header("Настройки движения")]
    public float moveSpeed = 6f;
    public float rotationSpeed = 10f;

    [Header("Ссылки")]
    public Transform cameraBoom; // Точка вращения камеры за игроком
    private CharacterController controller;
    private Camera mainCamera;

    [Networked] private Vector3 NetworkPosition { get; set; }
    [Networked] private Quaternion NetworkRotation { get; set; }

    override public void Spawned()
    {
        controller = GetComponent<CharacterController>();
        
        if (Object.HasInputAuthority)
        {
            mainCamera = Camera.main;
            if (cameraBoom == null)
            {
                // Создаем точку обзора камеры, если она не назначена
                GameObject boomObj = new GameObject("CameraBoom");
                cameraBoom = boomObj.transform;
                cameraBoom.parent = transform;
                cameraBoom.localPosition = new Vector3(0, 2f, 0);
            }
        }
    }

    public override void FixedUpdateNetwork()
    {
        if (Object.HasInputAuthority)
        {
            // Получаем ввод с клавиатуры или джойстика
            float moveX = Input.GetAxis("Horizontal"); // A/D или стрелки
            float moveZ = Input.GetAxis("Vertical");   // W/S или стрелки

            Vector3 moveDir = new Vector3(moveX, 0, moveZ).normalized;

            if (moveDir.magnitude >= 0.1f)
            {
                // Направление движения относительно поворота камеры
                float targetAngle = Mathf.Atan2(moveDir.x, moveDir.z) * Mathf.Rad2Deg + mainCamera.transform.eulerAngles.y;
                Quaternion rotation = Quaternion.Euler(0f, targetAngle, 0f);
                
                transform.rotation = Quaternion.Slerp(transform.rotation, rotation, rotationSpeed * Runner.DeltaTime);

                Vector3 moveVector = rotation * Vector3.forward;
                controller.Move(moveVector * moveSpeed * Runner.DeltaTime);
            }

            // Гравитация
            controller.Move(Vector3.down * 9.81f * Runner.DeltaTime);

            // Сохраняем позицию в сеть для других игроков
            NetworkPosition = transform.position;
            NetworkRotation = transform.rotation;
        }
        else
        {
            // Плавная интерполяция позиции для удаленных игроков
            transform.position = Vector3.Lerp(transform.position, NetworkPosition, Runner.DeltaTime * 15f);
            transform.rotation = Quaternion.Slerp(transform.rotation, NetworkRotation, Runner.DeltaTime * 15f);
        }
    }

    private void LateUpdate()
    {
        // Управление камерой за спиной локального игрока
        if (Object.HasInputAuthority && cameraBoom != null && mainCamera != null)
        {
            // Вращение камеры правой кнопкой мыши или свайпом
            float mouseX = Input.GetAxis("Mouse X") * 3f;
            float mouseY = Input.GetAxis("Mouse Y") * 3f;

            cameraBoom.Rotate(0, mouseX, 0);
            
            // Позиционируем саму камеру позади точки boom
            mainCamera.transform.position = cameraBoom.position - cameraBoom.forward * 6f + Vector3.up * 2f;
            mainCamera.transform.LookAt(cameraBoom.position + Vector3.up * 0.5f);
        }
    }
}
