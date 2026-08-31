import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { SharedModule } from '../../../../shared/shared.module';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';

import { AddUserComponent } from '../add-user/add-user.component';
import { ConfirmDeleteComponent } from '../../../../shared/confirm-delete/confirm-delete.component';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [SharedModule,TranslatePipe],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);


  // ============================================================
  // STATE
  // ============================================================

  readonly dataSource = signal(
    new MatTableDataSource<User>()
  );

  readonly displayedColumns = [
    'username',
    'email',
    'actions'
  ];


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    this.loadUsers();
  }


  // ============================================================
  // LOAD USERS
  // ============================================================

  loadUsers(): void {

    this.userService.getUsers().subscribe({
      next: users => {

        const dataSource = this.dataSource();

        dataSource.data = users;

        this.dataSource.set(dataSource);
      },

      error: error => {
        console.error(
          'Failed to load users:',
          error
        );
      }
    });

  }


  // ============================================================
  // ADD USER
  // ============================================================

  showAddUser(): void {

    this.dialog
      .open(AddUserComponent, {
        data: {
          user: null,
          add: true
        }
      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadUsers();
        }

      });

  }


  // ============================================================
  // EDIT USER
  // ============================================================

  editUser(user: User): void {

    this.dialog
      .open(AddUserComponent, {
        data: {
          user,
          add: false
        }
      })
      .afterClosed()
      .subscribe(result => {

        if (result?.status) {
          this.loadUsers();
        }

      });

  }


  // ============================================================
  // DELETE USER
  // ============================================================

  deleteUser(user: User): void {

    this.dialog
      .open(ConfirmDeleteComponent, {
        data: 'Are you sure you want to delete this item?'
      })
      .afterClosed()
      .subscribe(result => {

        if (!result?.status) {
          return;
        }

        this.userService
          .deleteUser(user)
          .subscribe({
            next: () => this.loadUsers(),

            error: error => {
              console.error(
                'Failed to delete user:',
                error
              );
            }
          });

      });

  }

}